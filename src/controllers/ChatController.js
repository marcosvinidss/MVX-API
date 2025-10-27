const Message = require('../models/Message');
const User = require('../models/User');

const ChatController = {
  // POST /chat
  sendMessage: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const senderId = req.user.id;
      const { adId, receiverId, message } = req.body;

      if (!adId || !receiverId || !message) {
        return res.status(400).json({ error: 'Dados incompletos.' });
      }

      const saved = await Message.create({
        adId,
        senderId,
        receiverId,
        message,
        timestamp: new Date(),
        read: false
      });

      return res.json(saved);
    } catch (err) {
      console.error('Erro em sendMessage:', err);
      return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
  },

  // GET /chat/:adId/:otherUserId
  getChatHistory: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const userId = req.user.id;
      const { adId, otherUserId } = req.params;

      if (!adId || !otherUserId) {
        return res.status(400).json({ error: 'Parâmetros ausentes.' });
      }

      const msgs = await Message.find({
        adId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }).sort({ timestamp: 1 });

      return res.json({ messages: msgs });
    } catch (err) {
      console.error('Erro em getChatHistory:', err);
      return res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
  },

  // GET /chat/conversations
  // -> lista TODAS as conversas do usuário logado (todas as pessoas com quem ele já falou)
  getUserConversations: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const userId = req.user.id;
      console.log('[getUserConversations] userId autenticado:', userId);

      // pega todas as mensagens onde esse user participou (como remetente ou destinatário)
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
        .sort({ timestamp: -1 }) // mais recente primeiro
        .lean();

      console.log('[getUserConversations] mensagens encontradas:', messages.length);

      // vamos agrupar por (adId + outroUsuário)
      const convMap = new Map();

      for (const msg of messages) {
        const otherUserId =
          msg.senderId.toString() === userId
            ? msg.receiverId.toString()
            : msg.senderId.toString();

        const convKey = `${msg.adId}_${otherUserId}`;

        if (!convMap.has(convKey)) {
          convMap.set(convKey, {
            adId: msg.adId,
            otherUserId,
            lastMessage: msg.message,
            updatedAt: msg.timestamp
          });
        }
      }

      // enriquecer com nome do outro usuário
      const result = [];
      for (const conv of convMap.values()) {
        const otherUser = await User.findById(conv.otherUserId).lean();
        result.push({
          adId: conv.adId,
          otherUserId: conv.otherUserId,
          otherUserName: otherUser ? otherUser.name : 'Usuário',
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt
        });
      }

      console.log('[getUserConversations] retornando conversas:', result.length);

      return res.json(result);
    } catch (err) {
      console.error('Erro em getUserConversations:', err);
      return res.status(500).json({ error: 'Erro ao carregar conversas.' });
    }
  }
};

module.exports = ChatController;
