const fs = require('fs');
const path = require('path');
const { Client } = require('../node_modules/pg');

const envPath = path.join(__dirname, '..', '.env.aws');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
);

(async () => {
  const client = new Client({
    host: env.DATABASE_HOST, port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER, password: env.DATABASE_PASSWORD, database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name
  `);
  console.log(`=== Tables (${tables.rows.length}) ===`);
  console.log(tables.rows.map(r => r.table_name).join(', '));

  const counts = [
    ['users', 'users'],
    ['products', 'products'],
    ['malls', 'malls'],
    ['home_blocks', 'home_blocks'],
    ['market_products', 'market_products'],
    ['exhibitions', 'exhibitions'],
    ['academies', 'academies'],
    ['coupons', 'coupons'],
    ['app_settings', 'app_settings'],
  ];
  console.log('\n=== Row counts ===');
  for (const [label, t] of counts) {
    const r = await client.query(`SELECT COUNT(*)::int AS c FROM "${t}"`);
    console.log(`${label.padEnd(20)} ${r.rows[0].c}`);
  }

  console.log('\n=== Admin user ===');
  const admin = await client.query(`SELECT id, email, nickname, role FROM users WHERE role='admin'`);
  console.log(admin.rows);

  console.log('\n=== Sample product ===');
  const p = await client.query(`SELECT title, platform, price, "cashbackRate" FROM products LIMIT 3`);
  console.log(p.rows);

  await client.end();
})().catch(err => { console.error(err); process.exit(1); });
