const { User } = require('../src/models');
const { sequelize } = require('../src/database');

async function test() {
  try {
    await sequelize.authenticate();
    
    // Find the user João Silva
    let user = await User.findOne({ where: { email: 'joao@email.com' } });
    if (!user) {
      console.error("❌ User joao@email.com not found in database.");
      return;
    }

    console.log("Original address in DB:", user.address);

    // Mock new address JSON
    const mockAddress = JSON.stringify({
      street: "Rua Verificacao",
      number: "456",
      neighborhood: "Bairro Teste",
      complement: "Sala 2",
      city: "Campo Grande",
      reference: "Perto do parque"
    });

    // Update user's address
    await User.update({ address: mockAddress }, { where: { id: user.id } });
    console.log("✅ Update query executed successfully.");

    // Fetch again to verify
    user = await User.findOne({ where: { id: user.id } });
    console.log("Updated address in DB:", user.address);

    if (user.address === mockAddress) {
      console.log("🎉 Database verification PASSED: Address was successfully saved and fetched!");
    } else {
      console.error("❌ Database verification FAILED: Saved address does not match expected output.");
    }
  } catch (error) {
    console.error("❌ Verification failed with error:", error);
  } finally {
    await sequelize.close();
  }
}

test();
