const { validationResult, matchedData } = require('express-validator');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const State = require('../models/State');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');

module.exports = {
  // ==========================
  // 1️⃣ FUNÇÕES DE USUÁRIO NORMAL
  // ==========================

  // Retorna lista de estados (para o cadastro)
  getStates: async (req, res) => {
    try {
      const states = await State.find();
      res.json({ states });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar estados.' });
    }
  },

  // Retorna informações do usuário logado
  info: async (req, res) => {
    try {
      const token = req.query.token;
      const user = await User.findOne({ token });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const state = await State.findById(user.state);
      const ads = await Ad.find({ idUser: user._id.toString() });

      const adList = await Promise.all(
        ads.map(async (ad) => {
          const cat = await Category.findById(ad.category);
          return {
            id: ad._id,
            status: ad.status,
            images: ad.images,
            dateCreated: ad.dateCreated,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            views: ad.views,
            category: cat ? cat.slug : null,
          };
        })
      );

      res.json({
        name: user.name,
        email: user.email,
        state: state ? state.name : null,
        ads: adList,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar informações do usuário.' });
    }
  },

  // Permite editar dados do perfil
  editAction: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.mapped() });
    }

    try {
      const data = matchedData(req);
      const user = await User.findOne({ token: data.token });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const updates = {};

      if (data.name) updates.name = data.name;

      if (data.email && data.email !== user.email) {
        const emailCheck = await User.findOne({ email: data.email });
        if (emailCheck) {
          return res.json({ error: 'E-mail já existente.' });
        }
        updates.email = data.email;
      }

      if (data.state) {
        if (!mongoose.Types.ObjectId.isValid(data.state)) {
          return res.json({ error: 'Código de estado inválido.' });
        }
        const stateCheck = await State.findById(data.state);
        if (!stateCheck) {
          return res.json({ error: 'Estado não encontrado.' });
        }
        updates.state = data.state;
      }

      if (data.password) {
        updates.password = await bcrypt.hash(data.password, 10);
      }

      await User.findOneAndUpdate({ token: data.token }, { $set: updates });
      res.json({ msg: 'Dados atualizados com sucesso.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar informações do usuário.' });
    }
  },

  // Alterna favorito (adiciona ou remove)
  toggleFavorite: async (req, res) => {
    try {
      const userId = req.user.id;
      const adId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const index = user.favorites.indexOf(adId);
      if (index > -1) {
        user.favorites.splice(index, 1);
      } else {
        user.favorites.push(adId);
      }

      await user.save();
      res.json({ favorites: user.favorites });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar favoritos.' });
    }
  },

  // Lista os favoritos do usuário
  getFavorites: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('favorites');
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const favorites = await Promise.all(
        user.favorites.map(async (ad) => {
          const cat = await Category.findById(ad.category);
          return {
            id: ad._id,
            title: ad.title,
            price: ad.price,
            images: ad.images,
            category: cat ? cat.slug : null,
          };
        })
      );

      res.json({ favorites });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar favoritos.' });
    }
  },

  // ==========================
  // 2️⃣ FUNÇÕES ADMINISTRATIVAS
  // ==========================

  // Lista todos os usuários (somente admin)
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, '-password -token -__v');
      res.json({ users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro ao buscar usuários.' });
    }
  },

  // Deleta um usuário específico (somente admin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await User.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ msg: 'Usuário não encontrado.' });
      }

      res.json({ msg: 'Usuário excluído com sucesso.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro ao excluir usuário.' });
    }
  },
};
