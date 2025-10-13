const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validationResult, matchedData } = require('express-validator');

const User = require('../models/User');
const State = require('../models/State');

module.exports = {
  // ==== LOGIN DE USUÁRIO NORMAL ====
  signin: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ error: errors.mapped() });
    }

    const data = matchedData(req);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.json({ error: 'Email ou senha errados!' });
    }

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      return res.json({ error: 'Email ou senha errados!' });
    }

    const payload = (Date.now() + Math.random()).toString();
    const token = await bcrypt.hash(payload, 10);

    user.token = token;
    await user.save();

    res.json({
      token,
      email: data.email,
      role: user.role // devolve a role do usuário (user/admin)
    });
  },

  // ==== CADASTRO DE USUÁRIO ====
  signup: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ error: errors.mapped() });
    }

    const data = matchedData(req);

    const user = await User.findOne({ email: data.email });
    if (user) {
      return res.json({
        error: { email: { msg: 'O E-mail já existe!' } }
      });
    }

    if (!mongoose.Types.ObjectId.isValid(data.state)) {
      return res.json({
        error: { state: { msg: 'Código de estado inválido' } }
      });
    }

    const stateItem = await State.findById(data.state);
    if (!stateItem) {
      return res.json({
        error: { state: { msg: 'O Estado não existe' } }
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const payload = (Date.now() + Math.random()).toString();
    const token = await bcrypt.hash(payload, 10);

    const newUser = new User({
      name: data.name,
      email: data.email,
      password: passwordHash,
      token,
      state: data.state,
      role: 'user' // padrão
    });

    await newUser.save();
    res.json({ token });
  },

  // ==== LOGIN DE ADMINISTRADOR ====
  adminSignin: async (req, res) => {
    const { email, password } = req.body;

    try {
      const admin = await User.findOne({ email });

      // Verifica se o usuário existe e tem role = admin
      if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ msg: 'Acesso negado: não é administrador.' });
      }

      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return res.status(401).json({ msg: 'Senha incorreta.' });
      }

      const payload = (Date.now() + Math.random()).toString();
      const token = await bcrypt.hash(payload, 10);

      admin.token = token;
      await admin.save();

      res.json({
        msg: 'Login de administrador bem-sucedido!',
        token,
        admin: {
          name: admin.name,
          email: admin.email
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro interno no login de administrador.' });
    }
  }
};
