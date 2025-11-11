const express = require('express');
const router = express.Router();

const Auth = require('./middlewares/Auth');
const AdminAuth = require('./middlewares/AdminAuth');
const OptionalAuth = require('./middlewares/OptionalAuth');

const AuthValidator = require('./validators/AuthValidator');
const UserValidator = require('./validators/UserValidator');

const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const AdsController = require('./controllers/AdsController');
const ReportController = require('./controllers/ReportController');
const ChatController = require('./controllers/ChatController');

// ---------- PÚBLICAS ----------
router.get('/ping', (req, res) => res.json({ pong: true }));
router.get('/states', UserController.getStates);
router.post('/user/signup', AuthValidator.signup, AuthController.signup);
router.post('/user/signin', AuthValidator.signin, AuthController.signin);

// ---------- USER LOGADO ----------
router.get('/user/me', Auth.private, UserController.info);
router.put('/user/me', Auth.private, UserValidator.editAction, UserController.editAction);

// ⚠️ /user/favorites precisa vir ANTES de /user/:id para não colidir
router.get('/user/favorites', Auth.private, UserController.getFavorites);

// rota por id (deixa simples para evitar erro de regex)
router.get('/user/:id', UserController.getUserById);

// favoritos (toggle)
router.post('/ad/:id/favorite', Auth.private, UserController.toggleFavorite);

// ---------- ANÚNCIOS ----------
router.get('/categories', AdsController.getCategories);
router.post('/ad/add', Auth.private, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', OptionalAuth, AdsController.getItem);
router.post('/ad/:id', Auth.private, AdsController.editAction);
router.delete('/ad/:id', Auth.private, AdsController.deleteAction);
router.get('/ad/my-ads', Auth.private, AdsController.getListByUser);

// ---------- REPORTS ----------
router.post('/report', Auth.private, ReportController.create);
router.get('/report', Auth.private, ReportController.list);
router.put('/report/:id/status', Auth.private, ReportController.updateStatus);

// ---------- CHAT ----------
router.post('/chat', Auth.private, ChatController.sendMessage);
router.get('/chat/:adId/:otherUserId', Auth.private, ChatController.getChatHistory);
router.get('/chat/conversations', Auth.private, ChatController.getUserConversations);

// ---------- ADMIN ----------
router.post('/admin/login', AuthController.adminSignin);
router.get('/admin/users', UserController.getAllUsers);
router.delete('/admin/user/:id', UserController.deleteUser);
router.get('/admin/reports', ReportController.getAllReports);
router.put('/admin/report/:id/status', ReportController.updateStatusAdmin);

module.exports = router;
