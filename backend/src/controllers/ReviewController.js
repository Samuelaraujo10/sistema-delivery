const { Review, Order, Product, User, Establishment } = require('../models');

class ReviewController {
  // Cria uma nova avaliação
  async create(req, res) {
    const { order_id, establishment_id, product_id, rating, comment } = req.body;
    const user_id = req.user.id; // assumindo que a rota está protegida por authMiddleware

    // Validações básicas
    if (!order_id || !establishment_id || !rating) {
      return res.status(400).json({ success: false, message: 'Dados incompletos para avaliação' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'A nota deve estar entre 1 e 5' });
    }

    // Verifica se o pedido pertence ao usuário e se está entregue
    const order = await Order.findOne({ where: { id: order_id, user_id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Só é possível avaliar pedidos entregues' });
    }

    // Verifica se já existe uma avaliação para este pedido (loja ou produto específico)
    const existingReview = await Review.findOne({
      where: {
        order_id,
        user_id,
        product_id: product_id || null
      }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Você já avaliou este item neste pedido' });
    }

    // Cria a avaliação
    const review = await Review.create({
      user_id,
      order_id,
      establishment_id,
      product_id: product_id || null,
      rating,
      comment
    });

    return res.status(201).json({ success: true, data: review, message: 'Avaliação enviada com sucesso!' });
  }

  // Lista avaliações de uma loja (apenas avaliações onde product_id é null ou opcionalmente todas)
  async getByEstablishment(req, res) {
    const { id } = req.params;
    
    // Busca avaliações feitas para o estabelecimento (gerais)
    const reviews = await Review.findAll({
      where: { establishment_id: id, product_id: null },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcula a média
    const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        reviews,
        averageRating: Number(averageRating),
        totalReviews: reviews.length
      }
    });
  }

  // Lista avaliações de um produto
  async getByProduct(req, res) {
    const { id } = req.params;
    
    const reviews = await Review.findAll({
      where: { product_id: id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        reviews,
        averageRating: Number(averageRating),
        totalReviews: reviews.length
      }
    });
  }
}

module.exports = new ReviewController();
