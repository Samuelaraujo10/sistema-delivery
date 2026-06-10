const router = require('express').Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);
router.put('/profile', authMiddleware, AuthController.updateProfile);

module.exports = router;
