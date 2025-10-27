const express = require('express');
const router = express.Router();

// ========================
// 1️⃣ IMPORTS
// ========================
const Auth = require('./middlewares/Auth');
const AdminAuth = require('./middlewares/AdminAuth');

const AuthValidator = require('./validators/AuthValidator');
const UserValidator = require('./validators/UserValidator');

const AuthController = require("./controllers/AuthController");
const UserController = require("./controllers/UserController");
const AdsController = require("./controllers/AdsController");
const ReportController = require('./controllers/ReportController');
const ChatController = require('./controllers/ChatController'); // <-- NOVO

// ========================
// 2️⃣ ROTAS PÚBLICAS
// ========================
router.get('/ping', (req, res) => res.json({ pong: true }));

router.get('/states', UserController.getStates);

router.post('/user/signup', AuthValidator.signup, AuthController.signup);
router.post('/user/signin', AuthValidator.signin, AuthController.signin);

// ========================
// 3️⃣ ROTAS DE USUÁRIO AUTENTICADO
// ========================
router.get('/user/me', Auth.private, UserController.info);
router.put('/user/me', Auth.private, UserValidator.editAction, UserController.editAction);

// Favoritos
router.post('/ad/:id/favorite', Auth.private, UserController.toggleFavorite);
router.get('/user/favorites', Auth.private, UserController.getFavorites);

// Anúncios
router.get('/categories', AdsController.getCategories);
router.post('/ad/add', Auth.private, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id', Auth.private, AdsController.editAction);
router.delete('/ad/:id', Auth.private, AdsController.deleteAction);
router.get('/ad/my-ads', Auth.private, AdsController.getListByUser);

// Denúncias (reports)
router.post('/report', Auth.private, ReportController.create);
router.get('/report', Auth.private, ReportController.list);
router.put('/report/:id/status', Auth.private, ReportController.updateStatus);

// ========================
// 4️⃣ CHAT INTERNO
// ========================

// enviar mensagem
router.post('/chat', Auth.private, ChatController.sendMessage);

// histórico entre usuário logado e outro usuário, num anúncio
router.get('/chat/:adId/:otherUserId', Auth.private, ChatController.getChatHistory);

// lista de conversas recentes para a página /messages
router.get('/chat/conversations', Auth.private, ChatController.getUserConversations);

// ========================
// 5️⃣ ROTAS ADMINISTRATIVAS
// ========================

// Login do administrador
router.post('/admin/login', AuthController.adminSignin);

// Rotas "admin" (no seu código atual estão públicas)
router.get('/admin/users', UserController.getAllUsers);
router.delete('/admin/user/:id', UserController.deleteUser);

router.get('/admin/reports', ReportController.getAllReports);
router.put('/admin/report/:id/status', ReportController.updateStatusAdmin);

module.exports = router;
