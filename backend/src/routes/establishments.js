const router = require('express').Router();
const EstablishmentController = require('../controllers/EstablishmentController');

const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.get('/', EstablishmentController.index);
router.get('/:slug', EstablishmentController.show);

// Restricted to Super Admin
router.post('/', authMiddleware, adminMiddleware, EstablishmentController.create);
router.put('/:id', authMiddleware, adminMiddleware, EstablishmentController.update);
router.delete('/:id', authMiddleware, adminMiddleware, EstablishmentController.destroy);

// Restricted to Admin of the store
router.patch('/:id/toggle-open', authMiddleware, adminMiddleware, EstablishmentController.toggleOpen);

module.exports = router;
