const OrderController = require('../src/controllers/OrderController');
const { User, Establishment, Order, Product } = require('../src/models');
const { sequelize } = require('../src/database');

async function testStatusUpdate() {
  try {
    await sequelize.authenticate();

    // 1. Obter o lojista
    const user = await User.findOne({ where: { email: 'adminpasta@delivery.com' } });
    if (!user) {
      console.error("Lojista não encontrado! Rode setup_test_admin.js primeiro.");
      return;
    }

    // 2. Obter o estabelecimento
    const establishment = await Establishment.findByPk(user.establishmentId);
    if (!establishment) {
      console.error("Estabelecimento do lojista não encontrado!");
      return;
    }

    // 3. Obter ou criar um produto para criar o pedido
    let product = await Product.findOne({ where: { establishmentId: establishment.id } });
    if (!product) {
      // Criar produto temporário se não houver
      product = await Product.create({
        name: 'Prato de Teste',
        price: 30.00,
        establishmentId: establishment.id,
        available: true
      });
    }

    // 4. Criar um pedido pendente para teste
    const order = await Order.create({
      establishmentId: establishment.id,
      userId: user.id, // cliente simulado (o próprio user)
      subtotal: 30.00,
      deliveryFee: 5.00,
      total: 35.00,
      status: 'pending',
      paymentMethod: 'pix',
      deliveryAddress: 'Rua de Teste'
    });

    console.log(`Pedido criado: ID ${order.id}, Status: ${order.status}`);

    // 5. Mock de requisição para atualizar status para 'confirmed' (Aceitar)
    const req = {
      params: { id: order.id },
      user: { id: user.id, role: user.role, establishmentId: user.establishmentId }, // Lojista logado
      body: { status: 'confirmed' }
    };

    let responseData = null;
    let responseStatus = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    // Chamar updateStatus
    await OrderController.updateStatus(req, res);
    console.log("Response Status:", responseStatus || 200);
    console.log("Response Data:", responseData);

    // 6. Verificar se o status atualizou no DB
    const updatedOrder = await Order.findByPk(order.id);
    console.log(`Status atualizado no DB: ${updatedOrder.status}`);

    if (updatedOrder.status === 'confirmed') {
      console.log("🎉 Test PASSED: Lojista successfully accepted/updated status of their own restaurant's order!");
    } else {
      console.error("❌ Test FAILED: Lojista was unable to update order status.");
    }

    // Limpar pedido de teste
    await order.destroy();

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

testStatusUpdate();
