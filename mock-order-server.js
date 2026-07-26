const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

let nextOrderId = 1000;
const orders = {};

const logsDir = path.join(__dirname, 'logs');

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
        const orderId = nextOrderId++;
        const order = {
          orderId,
          status: 'NEW',
          createdAt: new Date().toISOString(),
          ...payload,
        };
        orders[orderId] = order;
        appendOrderToDailyLog(order);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(order));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/orders/')) {
    const orderId = Number(url.pathname.split('/')[2]);
    const order = orders[orderId];
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Order not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(order));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock order service running at http://localhost:${PORT}`);
});
