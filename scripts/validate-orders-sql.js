const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

function expectPass(db, sql, params, name) {
  try {
    db.run(sql, params);
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(`  ${error.message}`);
    return false;
  }
}

function expectFail(db, sql, params, name) {
  try {
    db.run(sql, params);
    console.error(`FAIL: ${name}`);
    console.error('  Expected constraint error but insert succeeded.');
    return false;
  } catch (_) {
    console.log(`PASS: ${name}`);
    return true;
  }
}

(async () => {
  const sqlPath = path.join(__dirname, '..', 'sql', 'orders_schema.sql');
  const schemaSql = fs.readFileSync(sqlPath, 'utf8');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(schemaSql);

  const insertSql = `
    INSERT INTO orders (
      account_id, symbol, side, quantity, order_type, limit_price,
      time_in_force, client_order_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  let ok = true;

  ok = expectPass(
    db,
    insertSql,
    ['ACC12345', 'AAPL', 'BUY', 10, 'LIMIT', 170, 'GTC', 'PW-ORDER-001', 'NEW'],
    'valid LIMIT order'
  ) && ok;

  ok = expectPass(
    db,
    insertSql,
    ['ACC12345', 'MSFT', 'SELL', 5, 'MARKET', null, 'DAY', 'PW-ORDER-002', 'NEW'],
    'valid MARKET order'
  ) && ok;

  ok = expectFail(
    db,
    insertSql,
    ['ACC12345', 'AAPL', 'BUY', 10, 'LIMIT', null, 'GTC', 'PW-ORDER-003', 'NEW'],
    'LIMIT order must include limit_price'
  ) && ok;

  ok = expectFail(
    db,
    insertSql,
    ['ACC12345', 'TSLA', 'BUY', 0, 'MARKET', null, 'DAY', 'PW-ORDER-004', 'NEW'],
    'quantity must be > 0'
  ) && ok;

  ok = expectFail(
    db,
    insertSql,
    ['ACC12345', 'tsla', 'BUY', 1, 'MARKET', null, 'DAY', 'PW-ORDER-005', 'NEW'],
    'symbol must be uppercase letters'
  ) && ok;

  ok = expectFail(
    db,
    insertSql,
    ['ACC12345', 'NVDA', 'HOLD', 1, 'MARKET', null, 'DAY', 'PW-ORDER-006', 'NEW'],
    'side must be BUY or SELL'
  ) && ok;

  ok = expectFail(
    db,
    insertSql,
    ['ACC12345', 'AAPL', 'BUY', 1, 'MARKET', null, 'DAY', 'PW-ORDER-001', 'NEW'],
    'client_order_id must be unique'
  ) && ok;

  const countResult = db.exec('SELECT COUNT(*) AS count FROM orders');
  const validRows = countResult[0].values[0][0];
  console.log(`Inserted valid rows: ${validRows}`);

  if (!ok) {
    process.exitCode = 1;
  }
})();
