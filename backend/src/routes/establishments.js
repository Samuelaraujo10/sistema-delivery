const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EstablishmentController = require('../controllers/EstablishmentController');

const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const { createCloudinaryStorage } = require('../config/cloudinary');

const storage = createCloudinaryStorage('establishments');

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens sao permitidas'));
    }
    cb(null, true);
  },
});

router.get('/', EstablishmentController.index);
router.get('/:slug', EstablishmentController.show);

// Restricted to Super Admin
router.post('/', authMiddleware, adminMiddleware, upload.single('logoFile'), EstablishmentController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('logoFile'), EstablishmentController.update);
router.delete('/:id', authMiddleware, adminMiddleware, EstablishmentController.destroy);

// Restricted to Admin of the store
router.patch('/:id/toggle-open', authMiddleware, adminMiddleware, EstablishmentController.toggleOpen);

module.exports = router;

