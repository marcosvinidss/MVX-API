const { validationResult, matchedData } = require('express-validator');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const State = require('../models/State');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');

function getAuthUserId(req) {
  return req.userId || req.user?.id || req.user?._id || null;
}

module.exports = {
  getStates: async (req, res) => {
    try {
      const states = await State.find();
      return res.json({ states });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar estados.' });
    }
  },

  info: async (req, res) => {
    try {
      const token = req.query.token;
      const user = await User.findOne({ token });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const stateDoc = await State.findById(user.state);
      const ads = await Ad.find({ idUser: String(user._id) });

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
            category: cat ? cat.slug : null
          };
        })
      );

      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        state: stateDoc ? stateDoc._id : null,
        stateId: stateDoc ? stateDoc._id : null,
        stateName: stateDoc ? stateDoc.name : null,
        pixKey: user.pixKey || '',
        ads: adList
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar informações do usuário.' });
    }
  },

  editAction: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.mapped() });

    try {
      const data = matchedData(req);
      const user = await User.findOne({ token: data.token });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const updates = {};
      if (data.name) updates.name = data.name;

      if (data.email && data.email !== user.email) {
        const emailCheck = await User.findOne({ email: data.email });
        if (emailCheck) return res.json({ error: 'E-mail já existente.' });
        updates.email = data.email;
      }

      if (data.state) {
        if (!mongoose.Types.ObjectId.isValid(data.state))
          return res.json({ error: 'Código de estado inválido.' });
        const stateCheck = await State.findById(data.state);
        if (!stateCheck) return res.json({ error: 'Estado não encontrado.' });
        updates.state = data.state;
      }

      if (data.password) {
        updates.password = await bcrypt.hash(data.password, 10);
      }

      if (typeof req.body.pixKey === 'string') {
        const pix = req.body.pixKey.trim();
        if (pix.length > 0 && pix.length <= 140) updates.pixKey = pix;
        if (pix.length === 0) updates.pixKey = '';
      }

      await User.updateOne({ _id: user._id }, { $set: updates });
      return res.json({ msg: 'Dados atualizados com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar informações do usuário.' });
    }
  },

  // ========= FAVORITO: TOGGLE =========
  toggleFavorite: async (req, res) => {
    try {
      const authUserId = getAuthUserId(req);
      if (!authUserId) return res.status(401).json({ error: 'Usuário não autenticado.' });

      const adId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(adId)) {
        return res.status(400).json({ error: 'ID do anúncio inválido.' });
      }

      const ad = await Ad.findById(adId).select('_id');
      if (!ad) return res.status(404).json({ error: 'Anúncio não encontrado.' });

      const user = await User.findById(authUserId).select('_id favorites');
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const already = user.favorites.some(f => String(f) === String(adId));

      if (already) {
        await User.updateOne({ _id: authUserId }, { $pull: { favorites: adId } });
        const updated = await User.findById(authUserId).select('favorites');
        // compat: devolve array e flag
        return res.json({ favorites: updated.favorites || [], isFavorite: false, ok: true });
      } else {
        await User.updateOne({ _id: authUserId }, { $addToSet: { favorites: adId } });
        const updated = await User.findById(authUserId).select('favorites');
        return res.json({ favorites: updated.favorites || [], isFavorite: true, ok: true });
      }
    } catch (err) {
      console.error('[toggleFavorite]', err);
      return res.status(500).json({ error: 'Erro ao atualizar favoritos.' });
    }
  },

  // ========= FAVORITO: LISTAR =========
   getFavorites: async (req, res) => {
    try {
      // garante que o middleware Auth anexou o usuário
      const userDoc = req.user;
      if (!userDoc || !userDoc._id) {
        return res.status(401).json({ error: 'Não autenticado.' });
      }

      // usa SEMPRE o _id vindo do Auth (evita depender de query/body)
      const userId = String(userDoc._id);

      // não faça validação de ObjectId aqui — já temos o doc válido do Auth
      // carrega com populate para termos os anúncios completos
      const user = await User.findById(userId)
        .populate({
          path: 'favorites',
          populate: { path: 'category', select: 'slug name' }
        })
        .lean();

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // normaliza as imagens (usa default ou primeira)
      const favorites = (user.favorites || []).map((ad) => {
        let img = `${process.env.BASE}/media/no-image.png`;
        if (Array.isArray(ad.images) && ad.images.length > 0) {
          const def = ad.images.find((e) => e && e.default);
          const first = def || ad.images[0];
          if (first && first.url) {
            img = `${process.env.BASE}/media/${first.url}`;
          }
        }

        return {
          id: ad._id,
          title: ad.title || 'Sem título',
          price: ad.price ?? null,
          priceNegotiable: !!ad.priceNegotiable,
          images: [img],
          category: ad.category ? ad.category.slug : null,
          stateName: ad.stateName || null,
        };
      });

      return res.json({ favorites });
    } catch (err) {
      console.error('❌ getFavorites error:', err);
      return res.status(500).json({ error: 'Erro ao buscar favoritos.' });
    }
  },


  // ========= ADMIN =========
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, '-password -token -__v');
      return res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: 'Erro ao buscar usuários.' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'ID inválido.' });
      }
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ msg: 'Usuário não encontrado.' });
      return res.json({ msg: 'Usuário excluído com sucesso.' });
    } catch (err) {
      return res.status(500).json({ msg: 'Erro ao excluir usuário.' });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de usuário inválido.' });
      }
      const user = await User.findById(id, 'name email pixKey');
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        pixKey: user.pixKey || ''
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }
};
  