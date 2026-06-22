const express = require('express');
const router = express.Router();
const TabController = require('../controllers/TabController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/', authMiddleware, TabController.openTab);
router.get('/establishment/:establishmentId', authMiddleware, TabController.getOpenTabs);
router.post('/:id/close', authMiddleware, TabController.closeTab);

module.exports = router;
