import { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.ORDER_API_TOKEN || 'test-token';

export class OrdersApiClient {
  constructor(private request: APIRequestContext) {}

  async createOrder() {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'order-data.json');
    const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    if (BASE_URL !== 'http://localhost:3000') {
      throw new Error(`BAD BASE_URL=${BASE_URL}`);
    }

    const response = await this.request.post(`${BASE_URL}/orders`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      data: payload.order,
    });

    return {
      response,
      body: await response.json(),
    };
  }

  async getOrder(id: number) {
    const response = await this.request.get(`${BASE_URL}/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    return {
      response,
      body: await response.json(),
    };
  }
}
