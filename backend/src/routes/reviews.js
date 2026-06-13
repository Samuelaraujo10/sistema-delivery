const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { auth } = require('../middlewares/auth');

router.post('/', auth, ReviewController.create);
// As rotas GET de estabelecimento e produto serão colocadas nos roteadores respectivos ou aqui:
// Decidi colocar tudo aqui para organizar, mas pode ser /api/reviews/establishment/:id
router.get('/establishment/:id', ReviewController.getByEstablishment);
router.get('/product/:id', ReviewController.getByProduct);

module.exports = router;
