const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

(async () => {
  const sqlPath = path.join(__dirname, '..', 'sql', 'orders_schema.sql');
  const schemaSql = fs.readFileSync(sqlPath, 'utf8');

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(schemaSql);

  const tableStatusSql = `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'orders'
  `;

  const rowCountSql = 'SELECT COUNT(*) AS total_rows FROM orders';

  const tableStatus = db.exec(tableStatusSql);
  const rowCount = db.exec(rowCountSql);

  console.log('table_exists:', tableStatus.length > 0 ? 'YES' : 'NO');
  console.log('row_count:', rowCount[0].values[0][0]);
})();
