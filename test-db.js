const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://fixity_user:fixity_password@127.0.0.1:5432/fixity'
});
client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });
