// @vitest-skip
import { vi, Mock, describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest';
import { Server } from 'http';
import { webhookMonitoring } from '../webhook-monitoring';
import { resetAdminCache } from '../admin-bridge';

const { MockWebSocketServer } = vi.hoisted(() => {
    return { 
        MockWebSocketServer: vi.fn(() => ({
            on: vi.fn(),
            close: vi.fn(),
            clients: new Set()
        })) 
    };
});

vi.mock('ws', () => {
    return { WebSocketServer: MockWebSocketServer };
});

vi.mock('../admin-bridge', () => {
    const mockAdminDb = {
        collection: vi.fn(() => ({
            where: vi.fn(() => ({
                onSnapshot: vi.fn()
            })),
            doc: vi.fn(() => ({
                onSnapshot: vi.fn()
            })),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis()
        }))
    };
    return {
        adminDb: mockAdminDb,
        getAdminDb: () => mockAdminDb,
        resetAdminCache: vi.fn()
    };
});

describe.skip('WebhookMonitoring', () => {
    let server: Server;
    let mockWebSocket: any;

    beforeEach(() => {
        server = new Server();
        mockWebSocket = {
            readyState: 1, // WebSocket.OPEN
            send: vi.fn()
        };
        vi.clearAllMocks();
        
        // Reset admin cache if needed (mocked function)
        (resetAdminCache as Mock).mockClear();
    });

    afterAll(() => {
        delete (globalThis as any).adminDb;
    });

    afterEach(() => {
        server.close();
    });

    describe('initialize', () => {
        it('should initialize WebSocket server', () => {
            webhookMonitoring.initialize(server);
            expect(MockWebSocketServer).toHaveBeenCalledWith({ server });
        });
    });

    describe('broadcastPaymentEvent', () => {
        it('should broadcast payment event to connected clients', () => {
            // We need to simulate a connection first to have clients
            webhookMonitoring.initialize(server);
            
            // Get the mock WSS instance
            const mockWss = MockWebSocketServer.mock.results[0].value;
            
            // Simulate a connection
            const connectionHandler = mockWss.on.mock.calls.find((call: any) => call[0] === 'connection')[1];
            connectionHandler(mockWebSocket);

            const mockEvent = {
                type: 'payment_success',
                amount: 1000,
                reference: 'test-ref-123'
            };

            webhookMonitoring.broadcastPaymentEvent(mockEvent);
            
            expect(mockWebSocket.send).toHaveBeenCalled();
            const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
            expect(sentMessage.type).toBe('payment_event');
            expect(sentMessage.data).toEqual(mockEvent);
        });
    });
});

