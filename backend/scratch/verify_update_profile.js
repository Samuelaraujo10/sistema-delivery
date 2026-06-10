const AuthController = require('../src/controllers/AuthController');
const { User } = require('../src/models');
const { sequelize } = require('../src/database');

async function testUpdate() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'joao@email.com' } });
    if (!user) {
      console.error("User joao@email.com not found!");
      return;
    }

    // Mock request and response objects
    const req = {
      user: { id: user.id },
      body: {
        name: "João Silva Atualizado",
        phone: "(11) 98888-7777",
        address: JSON.stringify({ street: "Rua do Salto", number: "10" })
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

    await AuthController.updateProfile(req, res);
    console.log("Response Status:", responseStatus || 200);
    console.log("Response Data:", responseData);
    
    // Check if user was updated in DB
    const updatedUser = await User.findByPk(user.id);
    console.log("DB check name:", updatedUser.name);
    console.log("DB check phone:", updatedUser.phone);
    console.log("DB check address:", updatedUser.address);

    if (updatedUser.name === "João Silva Atualizado" && updatedUser.phone === "(11) 98888-7777") {
      console.log("🎉 Test PASSED: updateProfile controller test successful!");
    } else {
      console.error("❌ Test FAILED: profile updates did not apply.");
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

testUpdate();
