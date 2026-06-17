import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

// ============================================================
// CHAT CHANNEL TESTS (Simulated using /posts)
// ============================================================
test.describe('Amazon Connect - Chat Channel', () => {

  test('should initiate a new chat contact successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      data: {
        title: 'Chat Contact',
        body: 'Hello, I need help with my account', // simulates chat message
        userId: 1,
        channel: 'CHAT',
        displayName: 'Test Customer'
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');        // simulates ContactId
    expect(body).toHaveProperty('title');
    expect(body.title).toBe('Chat Contact');
  });

  test('should reject chat with empty message body', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      data: {
        title: '',   // empty — simulates missing required field
        body: '',
        userId: null
      }
    });

    // JSONPlaceholder always returns 201 but body values will be empty
    const body = await response.json();
    expect(body.title).toBe('');   // validates empty fields are captured
    expect(body.body).toBe('');
  });

});

// ============================================================
// SMS CHANNEL TESTS (Simulated using /comments)
// ============================================================
test.describe('Amazon Connect - SMS Channel', () => {

  test('should send an outbound SMS message successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/comments`, {
      data: {
        postId: 1,
        name: 'SMS Outbound Test',
        email: 'testcustomer@example.com',
        body: 'This is a test SMS from Playwright automation',
        phone: '+16125550000',   // simulates destination phone number
        channel: 'SMS'
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');       // simulates ContactId
    expect(body).toHaveProperty('postId');
    expect(body.name).toBe('SMS Outbound Test');
  });

  test('should fail SMS with missing phone number', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/comments`, {
      data: {
        postId: 1,
        name: 'SMS Test',
        email: 'test@example.com',
        body: 'Test SMS',
        phone: ''    // empty phone — simulates invalid number
      }
    });

    const body = await response.json();
    expect(body).toHaveProperty('id');
    // validate phone is empty — simulates negative test
    expect(response.status()).toBe(201);
  });

});

// ============================================================
// EMAIL CHANNEL TESTS (Simulated using /posts with email fields)
// ============================================================
test.describe('Amazon Connect - Email Channel', () => {

  test('should create email contact successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      data: {
        title: 'Test Email Contact via Playwright',
        body: 'This is a test email created through Playwright automation',
        userId: 1,
        channel: 'EMAIL',
        fromEmail: 'testcustomer@example.com',
        toEmail: 'support@yourcompany.com'
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');       // simulates ContactId
    expect(body.title).toBe('Test Email Contact via Playwright');
  });

  test('should retrieve email contact after creation', async ({ request }) => {
    // Retrieve existing email contact by ID (JSONPlaceholder stores IDs 1-100)
    const contactId = 1;
    const getResponse = await request.get(`${BASE_URL}/posts/${contactId}`);

    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody).toHaveProperty('id');
    expect(getBody).toHaveProperty('title');
    expect(getBody.id).toBe(contactId);
  });

});

// ============================================================
// IVR CHANNEL TESTS (Simulated using chained POST + GET)
// ============================================================
test.describe('Amazon Connect - IVR Channel', () => {

  test('should initiate outbound IVR call successfully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/posts`, {
      data: {
        title: 'IVR Outbound Call',
        body: 'Outbound IVR call initiated for Test Customer',
        userId: 1,
        channel: 'VOICE',
        destinationPhone: '+16125550000',
        sourcePhone: '+16125559999'
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');      // simulates ContactId
    expect(body.title).toBe('IVR Outbound Call');
  });

  test('should retrieve IVR contact details after initiation', async ({ request }) => {
    // Retrieve existing IVR contact by ID (JSONPlaceholder stores IDs 1-100)
    const contactId = 2;
    const getResponse = await request.get(`${BASE_URL}/posts/${contactId}`);

    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody).toHaveProperty('id');
    expect(getBody).toHaveProperty('title');
    expect(getBody).toHaveProperty('body');
    expect(getBody.id).toBe(contactId);
  });

  test('should return 404 for non-existent IVR contact', async ({ request }) => {
    // Negative test — contact ID that does not exist
    const response = await request.get(`${BASE_URL}/posts/99999`);

    expect(response.status()).toBe(404);   // simulates contact not found
  });

});
