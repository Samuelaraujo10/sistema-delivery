const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProductController = require('../controllers/ProductController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const { createCloudinaryStorage } = require('../config/cloudinary');

const storage = createCloudinaryStorage('products');

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

const { productSchema, updateProductSchema, validate } = require('../validations/productSchema');

router.get('/', ProductController.index);
router.get('/builder-items/:establishmentId', ProductController.builderItems);
router.get('/:id', ProductController.show);

// Admin only routes
// Nota: O middleware de upload deve vir antes da validação se os dados estiverem em FormData
router.post('/', authMiddleware, adminMiddleware, upload.single('imageFile'), validate(productSchema), ProductController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('imageFile'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authMiddleware, adminMiddleware, ProductController.destroy);

module.exports = router;
