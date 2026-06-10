const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EstablishmentController = require('../controllers/EstablishmentController');

const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'establishments');
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

