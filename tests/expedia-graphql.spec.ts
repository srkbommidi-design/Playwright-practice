import { test, expect } from '@playwright/test';

test('Verify Expedia GraphQL endpoint - GlobalHeaderQuery', async ({ request }) => {
    const response = await request.post('https://www.expedia.com/graphql', {
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
        },
        data: [
            {
                operationName: 'GlobalHeaderQuery',
                variables: {
                    minimal: false,
                    context: {
                        siteId: 1,
                        locale: 'en_US',
                        eapid: 0,
                        tpid: 1,
                        currency: 'USD',
                        device: { type: 'DESKTOP' },
                        identity: {
                            duaid: '3b4584c8-c763-4307-9e88-b167a5c7af49',
                            authState: 'ANONYMOUS',
                        },
                        privacyTrackingState: 'CAN_TRACK',
                    },
                    viewSize: 'MEDIUM',
                    lineOfBusiness: 'UNKNOWN',
                    theme: null,
                    pageName: 'home',
                },
                extensions: {
                    persistedQuery: {
                        version: 1,
                        sha256Hash:
                            '6f5f95f171105ecc76f1b616c78e2d6c108fea51465b6393a13fdea1b308ba49',
                    },
                },
            },
        ],
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body[0]).toHaveProperty('data');
});