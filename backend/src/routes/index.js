const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const establishmentRoutes = require('./establishments');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const orderRoutes = require('./orders');

const { optionalAuth } = require('../middlewares/auth');

router.use('/auth', authRoutes);
router.use('/establishments', establishmentRoutes);
router.use('/products', optionalAuth, productRoutes);
router.use('/categories', optionalAuth, categoryRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
