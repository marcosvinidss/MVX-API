const express = require('express');
const router = express.Router();

const Auth = require ('./middlewares/Auth');

const AuthValidator = require ('./validators/AuthValidator');
const AuthController = require("./controllers/AuthController");
const UserController = require("./controllers/UserController");
const AdsController = require("./controllers/AdsController");
const UserValidator = require('./validators/UserValidator');


router.get('/ping',(req, res)=>{
    res.json({pong: true});
})


router.get('/states',  UserController.getStates);

router.post('/user/signin', AuthValidator.signin, AuthController.signin);
router.post('/user/signup', AuthValidator.signup,  AuthController.signup);

router.get('/user/me', Auth.private, UserController.info);
router.put('/user/me', UserValidator.editAction, Auth.private, UserController.editAction);

router.get('/categories', AdsController.getCategories);
 
router.post('/ad/add',Auth.private, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id',Auth.private, AdsController.editAction);
router.delete('/ad/:id', Auth.private, AdsController.deleteAction);


router.get('/ad/list-by-user', Auth.private, AdsController.getListByUser);
router.get("/ad/my-ads", AdsController.getListByUser);

module.exports = router;