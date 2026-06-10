const axios = require('axios');

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@delivery.com',
      password: '123456'
    });
    const token = loginRes.data.data.token;
    console.log('Token obtained:', token.substring(0, 15) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Fetching products...');
    const pPromise = axios.get('http://localhost:3001/api/products?adminView=true', { headers })
      .then(res => console.log('Products fetched:', res.data.data.length))
      .catch(err => console.error('Products failed:', err.response?.data || err.message));

    console.log('Fetching categories...');
    const cPromise = axios.get('http://localhost:3001/api/categories', { headers })
      .then(res => console.log('Categories fetched:', res.data.data.length))
      .catch(err => console.error('Categories failed:', err.response?.data || err.message));

    console.log('Fetching establishments...');
    const ePromise = axios.get('http://localhost:3001/api/establishments', { headers })
      .then(res => console.log('Establishments fetched:', res.data.data.length))
      .catch(err => console.error('Establishments failed:', err.response?.data || err.message));

    console.log('Fetching orders...');
    const oPromise = axios.get('http://localhost:3001/api/orders', { headers })
      .then(res => console.log('Orders fetched:', res.data.data.length))
      .catch(err => console.error('Orders failed:', err.response?.data || err.message));

    await Promise.all([pPromise, cPromise, ePromise, oPromise]);
    console.log('All tests completed.');
  } catch (error) {
    console.error('Run failed:', error.response?.data || error.message);
  }
}

run();
