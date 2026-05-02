const router = require('express').Router();
const CategoryController = require('../controllers/CategoryController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.get('/', CategoryController.index);
router.post('/', authMiddleware, adminMiddleware, CategoryController.create);
router.put('/:id', authMiddleware, adminMiddleware, CategoryController.update);
router.delete('/:id', authMiddleware, adminMiddleware, CategoryController.destroy);

module.exports = router;
