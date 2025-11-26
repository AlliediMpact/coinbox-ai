import { Server } from 'http';
import WebSocket from 'ws';

// Mock admin-bridge before importing webhook-monitoring
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

vi.mock('../admin-bridge', () => ({
    adminDb: mockAdminDb,
    getAdminDb: () => mockAdminDb,
    resetAdminCache: vi.fn()
}));

// Import after mocking
import { webhookMonitoring } from '../webhook-monitoring';
import { resetAdminCache } from '../admin-bridge';

describe('WebhookMonitoring', () => {
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
        (resetAdminCache as any).mockClear();
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
            expect(webhookMonitoring['wss']).toBeDefined();
        });
    });

    describe('broadcastPaymentEvent', () => {
        beforeEach(() => {
            webhookMonitoring.initialize(server);
            // Add our test socket to the connected clients
            (webhookMonitoring as any).connectedClients = new Set([mockWebSocket]);
        });

        it('should broadcast payment event to connected clients', () => {
            const mockEvent = {
                type: 'payment_success',
                amount: 1000,
                reference: 'test-ref-123'
            };

            webhookMonitoring.broadcastPaymentEvent(mockEvent);

            // Verify the send method was called
            expect(mockWebSocket.send).toHaveBeenCalled();
            
            // Get the actual argument passed to send
            const sendArg = (mockWebSocket.send as jest.Mock).mock.calls[0][0];
            
            // Parse the JSON string that was sent
            const sentData = JSON.parse(sendArg);
            
            // Verify it has the correct structure
            expect(sentData.type).toBe('payment_event');
            expect(sentData.data).toEqual(mockEvent);
        });

        it('should not send to closed connections', () => {
            // Create a closed socket
            const closedSocket = {
                readyState: 3, // WebSocket.CLOSED
                send: jest.fn()
            };
            
            // Clear the connected clients and add only the closed socket
            (webhookMonitoring as any).connectedClients = new Set([closedSocket]);

            webhookMonitoring.broadcastPaymentEvent({ type: 'test' });

            // Verify send was not called on the closed socket
            expect(closedSocket.send).not.toHaveBeenCalled();
        });
    });
});
