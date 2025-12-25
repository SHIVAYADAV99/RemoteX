const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: 'localhost' }];
const opts = { days: 365 };

selfsigned.generate(attrs, opts, (err, pems) => {
  if (err) {
    console.error('Error generating certificates:', err);
    process.exit(1);
  }

  const keyPath = path.join(__dirname, 'server-key.pem');
  const certPath = path.join(__dirname, 'server-cert.pem');

  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);

  console.log('✅ Self-signed certificates generated successfully!');
  console.log(`   Private Key: ${keyPath}`);
  console.log(`   Certificate: ${certPath}`);
  console.log('');
  console.log('You can now run: npm run dev');
  console.log('The server should switch to HTTPS/WSS mode automatically.');
});