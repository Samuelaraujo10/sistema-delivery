const router = require('express').Router();
const OrderController = require('../controllers/OrderController');
const { authMiddleware, optionalAuth, adminMiddleware } = require('../middlewares/auth');

router.get('/events', authMiddleware, OrderController.events);
router.get('/', authMiddleware, OrderController.index);
router.post('/:id/notify-pix', authMiddleware, OrderController.notifyPix);
router.get('/user/:userId', authMiddleware, OrderController.userOrders);
router.get('/:id', authMiddleware, OrderController.show);
router.post('/', authMiddleware, OrderController.create);
router.patch('/:id/status', authMiddleware, adminMiddleware, OrderController.updateStatus);

module.exports = router;
