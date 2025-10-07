const Report = require('../models/Report');

module.exports = {
  // Criar nova denúncia
  create: async (req, res) => {
    try {
      const { reportedAd, reportedUser, reason, details } = req.body;

      // o usuário logado vem do middleware Auth
      const reporter = req.user.id;

      if (!reason) {
        return res.status(400).json({ error: 'O motivo da denúncia é obrigatório.' });
      }

      const report = new Report({
        reportedAd,
        reportedUser,
        reporter,
        reason,
        details,
      });

      await report.save();
      res.json({ msg: 'Denúncia enviada com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      res.status(500).json({ error: 'Erro ao enviar denúncia.' });
    }
  },

  // Listar denúncias (apenas admin)
  list: async (req, res) => {
    try {
      const reports = await Report.find()
        .populate('reporter', 'name email')
        .populate('reportedUser', 'name email')
        .populate('reportedAd', 'title');
      res.json(reports);
    } catch (error) {
      console.error('Erro ao listar denúncias:', error);
      res.status(500).json({ error: 'Erro ao listar denúncias.' });
    }
  },

  // Atualizar status da denúncia (admin)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatus = ['pendente', 'em análise', 'resolvido'];
      if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      await Report.findByIdAndUpdate(id, { status });
      res.json({ msg: 'Status atualizado.' });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  },
};
