const OrderController = require('../src/controllers/OrderController');
const { sequelize } = require('../src/database');

async function testBlock() {
  try {
    await sequelize.authenticate();

    // Mock request and response objects
    const req = {
      user: { id: 'some-uuid', role: 'admin' }, // Simulando um administrador logado
      body: {
        establishmentId: 'some-est-id',
        items: [{ productId: 'some-prod-id', quantity: 1 }],
        paymentMethod: 'pix',
        deliveryAddress: 'Rua de Teste'
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

    await OrderController.create(req, res);
    console.log("Response Status:", responseStatus || 200);
    console.log("Response Data:", responseData);
    
    if (responseStatus === 403 && responseData && responseData.message === 'Lojistas e administradores não podem realizar pedidos.') {
      console.log("🎉 Test PASSED: OrderController blocked order creation for admin user successfully!");
    } else {
      console.error("❌ Test FAILED: Admin was not blocked, or returned incorrect status/message.");
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

testBlock();
