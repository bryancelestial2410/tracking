const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

let sslConfig;

try {
  if (process.env.DB_CA_CERT) {
    // Fix newlines that Vercel strips from env variables
    const cert = process.env.DB_CA_CERT
       .replace(/\\n/g, '\n')   // handles escaped newlines
       .replace(/\r\n/g, '\n')  // handles Windows line endings
       .trim();                  // removes any leading/trailing whitespace
    sslConfig = { 
      ca: cert,
      rejectUnauthorized: false
    };
    console.log('✅ Using DB_CA_CERT from environment variable');
    console.log('✅ DB_CA_CERT preview:', cert.substring(0, 80));
  } else {
    // Local - uses ca.pem file
    sslConfig = { ca: fs.readFileSync('./ca.pem') };
    console.log('✅ Using ca.pem from local file');
  }
} catch (err) {
  console.error('❌ SSL config error:', err.message);
  sslConfig = { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('❌ Full error:', JSON.stringify(err, null, 2));
    console.error('❌ DB_HOST:', process.env.DB_HOST);
    console.error('❌ DB_USER:', process.env.DB_USER);
    console.error('❌ DB_NAME:', process.env.DB_NAME);
    console.error('❌ DB_PORT:', process.env.DB_PORT);
    console.error('❌ DB_CA_CERT exists:', !!process.env.DB_CA_CERT);
    console.error('❌ DB_CA_CERT preview:', process.env.DB_CA_CERT?.substring(0, 100));
    return;
  }
  console.log('✅ MySQL connected successfully!');
  connection.release();
});

module.exports = pool;