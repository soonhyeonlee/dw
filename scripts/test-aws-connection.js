const fs = require('fs');
const path = require('path');
const net = require('net');
const { Client } = require('../node_modules/pg');

const envPath = path.join(__dirname, '..', '.env.aws');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map((s, i) => i === 0 ? s : l.slice(l.indexOf('=') + 1)).slice(0, 2))
);

async function testPg() {
  const client = new Client({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
  });
  const t0 = Date.now();
  await client.connect();
  const res = await client.query('SELECT version() AS v, current_database() AS db, now() AS t');
  await client.end();
  return { latency: Date.now() - t0, ...res.rows[0] };
}

function testRedisTcp() {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const sock = net.createConnection({ host: env.REDIS_HOST, port: Number(env.REDIS_PORT) });
    sock.setTimeout(5000);
    sock.on('connect', () => {
      sock.write('PING\r\n');
    });
    sock.on('data', (d) => {
      const resp = d.toString().trim();
      sock.end();
      resolve({ latency: Date.now() - t0, reply: resp });
    });
    sock.on('timeout', () => { sock.destroy(); reject(new Error('Redis TCP timeout')); });
    sock.on('error', reject);
  });
}

(async () => {
  console.log('=== PostgreSQL (RDS) ===');
  try {
    const r = await testPg();
    console.log('OK', r);
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exitCode = 1;
  }

  console.log('\n=== Redis (ElastiCache) ===');
  try {
    const r = await testRedisTcp();
    console.log('OK', r);
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exitCode = 1;
  }
})();
