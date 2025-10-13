const User = require('../models/User');

module.exports = {
  adminOnly: async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ msg: 'Token não fornecido.' });
    }

    // Remove "Bearer " se existir
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      const user = await User.findOne({ token });

      if (!user) {
        return res.status(401).json({ msg: 'Usuário não encontrado.' });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ msg: 'Acesso negado. Apenas administradores podem acessar.' });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro interno no middleware de admin.' });
    }
  },
};
