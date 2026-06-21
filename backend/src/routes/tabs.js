const express = require('express');
const router = express.Router();
const TabController = require('../controllers/TabController');
const { auth } = require('../middlewares/auth');

router.post('/', auth, TabController.openTab);
router.get('/establishment/:establishmentId', auth, TabController.getOpenTabs);
router.post('/:id/close', auth, TabController.closeTab);

module.exports = router;
