const AuthController = require('../src/controllers/AuthController');
const { sequelize } = require('../src/database');

async function testLoginPayload() {
  try {
    await sequelize.authenticate();

    // Mock request and response objects
    const req = {
      body: {
        email: 'adminpasta@delivery.com',
        password: 'admin'
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

    await AuthController.login(req, res);
    console.log("Response Status:", responseStatus || 200);
    console.log("Response Data:", JSON.stringify(responseData, null, 2));

    const user = responseData?.data?.user;
    if (user && user.establishment && user.establishment.slug) {
      console.log(`\n🎉 Test PASSED: Login returned user with establishment: "${user.establishment.name}" and slug: "${user.establishment.slug}"`);
    } else {
      console.error("\n❌ Test FAILED: Establishment details (including slug) were not included in login response.");
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await sequelize.close();
  }
}

testLoginPayload();
