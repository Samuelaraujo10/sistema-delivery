const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProductController = require('../controllers/ProductController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens sao permitidas'));
    }
    cb(null, true);
  },
});

const { productSchema, validate } = require('../validations/productSchema');

router.get('/', ProductController.index);
router.get('/builder-items/:establishmentId', ProductController.builderItems);
router.get('/:id', ProductController.show);

// Admin only routes
// Nota: O middleware de upload deve vir antes da validação se os dados estiverem em FormData
router.post('/', authMiddleware, adminMiddleware, upload.single('imageFile'), validate(productSchema), ProductController.create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('imageFile'), validate(productSchema), ProductController.update);
router.delete('/:id', authMiddleware, adminMiddleware, ProductController.destroy);

module.exports = router;
