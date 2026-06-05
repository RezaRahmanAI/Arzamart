const http = require('http');
const https = require('https');

// Ignore self-signed certificate errors for local testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const loginPayload = JSON.stringify({
  username: 'superadmin',
  password: 'SuperAdmin@123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 7201,
  path: '/api/staff/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginPayload.length
  }
};

const req = https.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Login Response Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      if (response.success && response.data && response.data.accessToken) {
        const token = response.data.accessToken;
        console.log('Login Success. Token acquired.');
        // Decode JWT payload
        const payloadBase64 = token.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('ascii');
        console.log('Token Payload:', payloadJson);
        
        // Query roles and users
        queryRoles(token);
        queryUsers(token);
      } else {
        console.log('Login failed:', response);
      }
    } catch (e) {
      console.log('Error parsing login response:', e);
      console.log('Raw login response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Login request error:', error);
});

req.write(loginPayload);
req.end();

function queryRoles(token) {
  const rolesOptions = {
    hostname: 'localhost',
    port: 7201,
    path: '/api/staff/roles',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const reqRoles = https.request(rolesOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Query Roles Status:', res.statusCode);
      console.log('Query Roles Response:', data);
    });
  });

  reqRoles.on('error', (error) => {
    console.error('Query roles error:', error);
  });

  reqRoles.end();
}

function queryUsers(token) {
  const usersOptions = {
    hostname: 'localhost',
    port: 7201,
    path: '/api/staff/users',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const reqUsers = https.request(usersOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Query Users Status:', res.statusCode);
      console.log('Query Users Response length:', data.length);
      console.log('Query Users Response:', data.substring(0, 1000));
    });
  });

  reqUsers.on('error', (error) => {
    console.error('Query users error:', error);
  });

  reqUsers.end();
}
