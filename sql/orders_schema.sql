-- Orders table schema for local practice and validation
CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL CHECK(length(trim(account_id)) > 0),
  symbol TEXT NOT NULL CHECK(symbol GLOB '[A-Z][A-Z][A-Z]*'),
  side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  order_type TEXT NOT NULL CHECK(order_type IN ('MARKET', 'LIMIT')),
  limit_price REAL CHECK(limit_price IS NULL OR limit_price > 0),
  time_in_force TEXT NOT NULL CHECK(time_in_force IN ('DAY', 'GTC', 'IOC')),
  client_order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'FILLED', 'CANCELLED', 'REJECTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK(order_type <> 'LIMIT' OR limit_price IS NOT NULL)
);
