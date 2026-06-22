const router = require('express').Router();
const TeamController = require('../controllers/TeamController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Todas as rotas de equipe exigem autenticação e serem "admin" do próprio estabelecimento.
// O middleware `adminMiddleware` garante que o usuário tem role 'admin'.
// O TeamController verifica se há um establishmentId vinculado.

router.get('/', authMiddleware, adminMiddleware, TeamController.list);
router.post('/', authMiddleware, adminMiddleware, TeamController.create);
router.put('/:id', authMiddleware, adminMiddleware, TeamController.update);
router.delete('/:id', authMiddleware, adminMiddleware, TeamController.delete);

module.exports = router;
