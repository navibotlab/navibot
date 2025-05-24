const fetch = require('node-fetch');

async function testDebugAPI() {
  try {
    console.log('🔬 Testando API de debug...');
    
    const response = await fetch('http://localhost:3000/api/debug-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status OK:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testDebugAPI(); 