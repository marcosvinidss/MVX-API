const Report = require('../models/Report');

module.exports = {
  // Criar nova denúncia (usuário comum)
  create: async (req, res) => {
    try {
      const { reportedAd, reportedUser, reason, details } = req.body;
      const reporter = req.user.id; // vem do middleware Auth

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

  // Listar denúncias (usuário comum)
  list: async (req, res) => {
    try {
      const reports = await Report.find({ reporter: req.user.id })
        .populate('reporter', 'name email')
        .populate('reportedUser', 'name email')
        .populate('reportedAd', 'title');

      res.json(reports);
    } catch (error) {
      console.error('Erro ao listar denúncias:', error);
      res.status(500).json({ error: 'Erro ao listar denúncias.' });
    }
  },

  // Atualizar status da denúncia (usuário/admin)
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

  // ============================
  // 🔒 FUNÇÕES ADMINISTRATIVAS
  // ============================

  // Listar todas as denúncias (admin)
  getAllReports: async (req, res) => {
    try {
      const reports = await Report.find()
        .populate('reporter', 'name email')
        .populate('reportedUser', 'name email')
        .populate('reportedAd', 'title');

      res.json({ reports });
    } catch (error) {
      console.error('Erro ao listar todas as denúncias:', error);
      res.status(500).json({ error: 'Erro ao listar todas as denúncias.' });
    }
  },

  // Atualizar status de qualquer denúncia (admin)
  updateStatusAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatus = ['pendente', 'em análise', 'resolvido'];
      if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const report = await Report.findById(id);
      if (!report) {
        return res.status(404).json({ error: 'Denúncia não encontrada.' });
      }

      report.status = status;
      await report.save();

      res.json({ msg: 'Status da denúncia atualizado com sucesso.', report });
    } catch (error) {
      console.error('Erro ao atualizar status admin:', error);
      res.status(500).json({ error: 'Erro ao atualizar status (admin).' });
    }
  },
};
