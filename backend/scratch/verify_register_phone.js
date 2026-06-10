async function testRegistration() {
  try {
    console.log("Sending registration request WITHOUT phone number...");
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "Teste Phone Validation",
        email: `test_phone_${Date.now()}@email.com`,
        password: "password123"
      })
    });
    
    const data = await res.json();
    if (res.status === 400) {
      console.log("✅ Test PASSED: Received 400 Bad Request.");
      console.log("Response data:", data);
    } else {
      console.error("❌ Test FAILED: Registration succeeded or returned status:", res.status, data);
    }
  } catch (error) {
    console.error("❌ Test FAILED with error:", error.message);
  }
}

testRegistration();
