const router = require('express').Router();
const OrderController = require('../controllers/OrderController');
const { authMiddleware, optionalAuth, adminMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, OrderController.index);
router.get('/user/:userId', authMiddleware, OrderController.userOrders);
router.get('/:id', authMiddleware, OrderController.show);
router.post('/', optionalAuth, OrderController.create);
router.patch('/:id/status', authMiddleware, adminMiddleware, OrderController.updateStatus);

module.exports = router;
