const http = require('http');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { parse } = require('url');

const logsDir = path.join(__dirname, 'logs');
const dbDir = path.join(__dirname, 'db');
const dbPath = path.join(dbDir, 'orders.db');
const schemaPath = path.join(__dirname, 'sql', 'orders_schema.sql');

let db;

function ensureDbDir() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

function saveDb() {
  ensureDbDir();
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function rowToOrder(row) {
  return {
    orderId: row.order_id,
    accountId: row.account_id,
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    orderType: row.order_type,
    limitPrice: row.limit_price,
    timeInForce: row.time_in_force,
    clientOrderId: row.client_order_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function selectSingleOrder(orderId) {
  const stmt = db.prepare(`
    SELECT order_id, account_id, symbol, side, quantity, order_type, limit_price,
           time_in_force, client_order_id, status, created_at
    FROM orders
    WHERE order_id = ?
  `);
  stmt.bind([orderId]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function insertOrder(payload) {
  const stmt = db.prepare(`
    INSERT INTO orders (
      account_id, symbol, side, quantity, order_type, limit_price,
      time_in_force, client_order_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    payload.accountId,
    payload.symbol,
    payload.side,
    payload.quantity,
    payload.orderType,
    payload.limitPrice ?? null,
    payload.timeInForce,
    payload.clientOrderId,
    payload.status || 'NEW',
  ]);
  stmt.free();

  const idResult = db.exec('SELECT last_insert_rowid() AS id');
  const orderId = idResult[0].values[0][0];
  const row = selectSingleOrder(orderId);
  saveDb();
  return rowToOrder(row);
}

function listOrdersByDate(date) {
  const stmt = db.prepare(`
    SELECT order_id, account_id, symbol, side, quantity, order_type, limit_price,
           time_in_force, client_order_id, status, created_at
    FROM orders
    WHERE substr(created_at, 1, 10) = ?
    ORDER BY order_id ASC
  `);
  stmt.bind([date]);

  const rows = [];
  while (stmt.step()) {
    rows.push(rowToOrder(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

async function initDatabase() {
  const SQL = await initSqlJs();
  let buffer;
  if (fs.existsSync(dbPath)) {
    buffer = fs.readFileSync(dbPath);
  }
  db = buffer ? new SQL.Database(buffer) : new SQL.Database();
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.run(schemaSql);
  saveDb();
}

function getTodayLogFilePath() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logsDir, `orders-${date}.jsonl`);
}

function appendOrderToDailyLog(order) {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logPath = getTodayLogFilePath();
  fs.appendFileSync(logPath, `${JSON.stringify(order)}\n`, 'utf8');
}

const server = http.createServer((req, res) => {
  const url = parse(req.url, true);

  if (req.method === 'POST' && url.pathname === '/orders') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const order = insertOrder(payload);
        appendOrderToDailyLog(order);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(order));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/orders/')) {
    const orderId = Number(url.pathname.split('/')[2]);
    const row = selectSingleOrder(orderId);
    if (!row) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Order not found' }));
      return;
    }
    const order = rowToOrder(row);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(order));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/orders') {
    const date = (url.query.date || new Date().toISOString().slice(0, 10)).toString();
    const orders = listOrdersByDate(date);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ date, count: orders.length, orders }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
initDatabase()
  .then(() => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Mock order service running at http://localhost:${PORT}`);
      console.log(`Orders DB: ${dbPath}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  });
