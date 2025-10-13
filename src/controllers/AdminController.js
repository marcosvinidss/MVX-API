
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado.' });
      }

      // ⚠️ Aqui definimos quem é admin
      if (!user.isAdmin) {
        return res.status(403).json({ msg: 'Acesso negado: não é administrador.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ msg: 'Senha incorreta.' });
      }

      const token = jwt.sign(
        { id: user._id, isAdmin: true },
        process.env.JWT_SECRET || 'chavesecreta',
        { expiresIn: '2h' }
      );

      res.json({
        token,
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro no login do administrador.' });
    }
  },
};
