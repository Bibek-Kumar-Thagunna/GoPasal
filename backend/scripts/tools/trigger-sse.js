const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'test_dev_' + Date.now() })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.tokens.accessToken;

  console.log('Got token:', token.substring(0, 20) + '...');

  const req = http.get(`http://localhost:3000/api/v1/notifications/stream?token=${token}`, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk.toString()}`);
    });
  });

  // Keep alive for 1 second
  setTimeout(() => {}, 1000);
}
test();
