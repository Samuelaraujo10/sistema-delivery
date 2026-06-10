const OrderController = require('../src/controllers/OrderController');
const { User, Establishment, Product, Order } = require('../src/models');
const { sequelize } = require('../src/database');

async function testCustomerOrder() {
  try {
    await sequelize.authenticate();

    // 1. Obter ou criar um cliente
    let customer = await User.findOne({ where: { role: 'customer' } });
    if (!customer) {
      customer = await User.create({
        name: 'Cliente de Teste',
        email: `cliente-${Date.now()}@email.com`,
        password: 'password123',
        phone: '11999998888',
        role: 'customer'
      });
      console.log(`Cliente de teste criado: ${customer.email}`);
    } else {
      console.log(`Cliente de teste encontrado: ${customer.email}`);
    }

    // 2. Obter um restaurante ativo (Rafa Bistrô)
    const establishment = await Establishment.findOne({ where: { slug: 'pasta-co', active: true } });
    if (!establishment) {
      console.error("Restaurante Rafa Bistrô não encontrado!");
      return;
    }

    // 3. Obter um produto disponível dele
    const product = await Product.findOne({ where: { establishmentId: establishment.id, available: true } });
    if (!product) {
      console.error("Nenhum produto disponível no Rafa Bistrô!");
      return;
    }

    // 4. Mock da requisição de checkout de pedido
    const req = {
      user: { id: customer.id, role: customer.role, establishmentId: customer.establishmentId },
      body: {
        establishmentId: establishment.id,
        items: [
          { productId: product.id, quantity: 2 }
        ],
        paymentMethod: 'pix',
        deliveryAddress: 'Rua do Teste, 123',
        userAddress: JSON.stringify({ street: 'Rua do Teste', number: '123', neighborhood: 'Centro', city: 'Campo Grande' }),
        notes: 'Sem cebola'
      }
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

    // Chamar create
    await OrderController.create(req, res);
    console.log("Response Status:", responseStatus || 200);
    console.log("Response Data:", JSON.stringify(responseData, null, 2));

    if (responseStatus === 201 || (responseStatus === null && responseData && responseData.success)) {
      console.log("🎉 Test PASSED: Customer order creation was successful!");
      // Deletar o pedido criado para não poluir
      const createdOrderId = responseData.data.id;
      await Order.destroy({ where: { id: createdOrderId } });
      console.log("Pedido de teste excluído com sucesso.");
    } else {
      console.error("❌ Test FAILED: Customer order creation was blocked or failed!");
    }

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

testCustomerOrder();
