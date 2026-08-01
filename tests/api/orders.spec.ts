import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { OrdersApiClient } from '../apiClients/ordersApi';

function appendOrderToDailyLog(order: unknown) {
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(logsDir, `orders-${date}.jsonl`);
  fs.appendFileSync(logPath, `${JSON.stringify(order)}\n`, 'utf8');
}

test.describe('Orders API demo', () => {
  test('create an order from fixture data', async ({ request }, testInfo) => {
    const client = new OrdersApiClient(request);
    const { response, body } = await client.createOrder();

    appendOrderToDailyLog(body);

    console.log(`Created order ID: ${body.orderId}`);
    await testInfo.attach('created-order-id', {
      body: `Created order ID: ${body.orderId}`,
      contentType: 'text/plain',
    });

    expect(response.status()).toBe(201);
    expect(body).toHaveProperty('orderId');
    expect(body.symbol).toBe('AAPL');
    expect(body.side).toBe('BUY');
  });
});
