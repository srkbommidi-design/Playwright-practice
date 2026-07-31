const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const outputLines = [];

function emit(message, isError = false) {
  outputLines.push(message);
  if (isError) {
    console.error(message);
    return;
  }
  console.log(message);
}

function persistValidationLog() {
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logBody = `${outputLines.join('\n')}\n`;
  const outputPath = path.join(logsDir, `sql-validation-${timestamp}.log`);
  const latestPath = path.join(logsDir, 'sql-validation-latest.log');

  fs.writeFileSync(outputPath, logBody, 'utf8');
  fs.writeFileSync(latestPath, logBody, 'utf8');

  console.log(`Validation log saved to: ${outputPath}`);
  console.log(`Latest validation log: ${latestPath}`);
}

function resultToObjects(execResult) {
  if (!execResult || execResult.length === 0) {
    return [];
  }

  const [{ columns, values }] = execResult;
  return values.map((row) =>
    Object.fromEntries(columns.map((column, index) => [column, row[index]]))
  );
}

function formatRowsAsTable(rows) {
  if (!rows || rows.length === 0) {
    return 'No inserted rows found.';
  }

  const columns = Object.keys(rows[0]);
  const widths = columns.map((column) => {
    const maxValueWidth = Math.max(
      ...rows.map((row) => String(row[column] ?? 'NULL').length)
    );
    return Math.max(column.length, maxValueWidth);
  });

  const buildRow = (values) =>
    `| ${values
      .map((value, index) => String(value).padEnd(widths[index], ' '))
      .join(' | ')} |`;

  const header = buildRow(columns);
  const separator = `|-${widths.map((w) => '-'.repeat(w)).join('-|-')}-|`;
  const dataRows = rows.map((row) =>
    buildRow(columns.map((column) => row[column] ?? 'NULL'))
  );

  return [header, separator, ...dataRows].join('\n');
}

function expectPass(db, sql, params, name) {
  try {
    db.run(sql, params);
    emit(`PASS: ${name}`);
    return true;
  } catch (error) {
    emit(`FAIL: ${name}`, true);
    emit(`  ${error.message}`, true);
    return false;
  }
}

function expectFail(db, sql, params, name) {
  try {
    db.run(sql, params);
    emit(`FAIL: ${name}`, true);
    emit('  Expected constraint error but insert succeeded.', true);
    return false;
  } catch (_) {
    emit(`PASS: ${name}`);
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
  emit(`Inserted valid rows: ${validRows}`);

  const insertedRowsResult = db.exec(`
    SELECT
      order_id,
      account_id,
      symbol,
      side,
      quantity,
      order_type,
      limit_price,
      time_in_force,
      client_order_id,
      status,
      created_at
    FROM orders
    ORDER BY order_id ASC
  `);
  const insertedRows = resultToObjects(insertedRowsResult);
  emit('Inserted rows table:');
  emit(formatRowsAsTable(insertedRows));

  persistValidationLog();

  if (!ok) {
    process.exitCode = 1;
  }
})();
