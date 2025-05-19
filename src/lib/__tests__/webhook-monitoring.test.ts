import { Server } from 'http';
import WebSocket from 'ws';
import { webhookMonitoring } from '../webhook-monitoring';
import { adminDb } from '../firebase-admin';

jest.mock('../firebase-admin', () => ({
    adminDb: {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        onSnapshot: jest.fn(),
        where: jest.fn().mockReturnThis()
    }
}));

describe('WebhookMonitoring', () => {
    let server: Server;
    let mockWebSocket: WebSocket;

    beforeEach(() => {
        server = new Server();
        mockWebSocket = {
            readyState: WebSocket.OPEN,
            send: jest.fn()
        } as unknown as WebSocket;
        jest.clearAllMocks();
    });

    afterEach(() => {
        server.close();
    });

    describe('initialize', () => {
        it('should initialize WebSocket server', () => {
            webhookMonitoring.initialize(server);
            expect(webhookMonitoring['wss']).toBeDefined();
        });

        it('should set up Firestore listeners on initialization', () => {
            webhookMonitoring.initialize(server);
            expect(adminDb.collection).toHaveBeenCalledWith('payment_analytics');
            expect(adminDb.where).toHaveBeenCalledWith('timestamp', '>=', expect.any(Date));
        });
    });

    describe('broadcastPaymentEvent', () => {
        beforeEach(() => {
            webhookMonitoring.initialize(server);
            (webhookMonitoring as any).connectedClients.add(mockWebSocket);
        });

        it('should broadcast payment event to connected clients', () => {
            const mockEvent = {
                type: 'payment_success',
                amount: 1000,
                reference: 'test-ref-123'
            };

            webhookMonitoring.broadcastPaymentEvent(mockEvent);

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                expect.stringContaining('"type":"payment_event"')
            );
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                expect.stringContaining(JSON.stringify(mockEvent))
            );
        });

        it('should not send to closed connections', () => {
            const closedSocket = {
                readyState: WebSocket.CLOSED,
                send: jest.fn()
            } as unknown as WebSocket;
            (webhookMonitoring as any).connectedClients.add(closedSocket);

            webhookMonitoring.broadcastPaymentEvent({ type: 'test' });

            expect(closedSocket.send).not.toHaveBeenCalled();
            expect(mockWebSocket.send).toHaveBeenCalled();
        });
    });

    describe('Firestore listeners', () => {
        it('should broadcast new payment analytics', () => {
            webhookMonitoring.initialize(server);
            (webhookMonitoring as any).connectedClients.add(mockWebSocket);

            // Simulate a new payment analytics document
            const mockSnapshot = {
                docChanges: () => [{
                    type: 'added',
                    doc: {
                        id: 'test-123',
                        data: () => ({
                            userId: 'user-123',
                            amount: 1000,
                            status: 'success'
                        })
                    }
                }]
            };

            // Trigger the snapshot listener
            const onSnapshotCallback = (adminDb.collection().where().onSnapshot as jest.Mock)
                .mock.calls[0][0];
            onSnapshotCallback(mockSnapshot);

            expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"payment_event"'));
            expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
        });

        it('should broadcast metric updates', () => {
            webhookMonitoring.initialize(server);
            (webhookMonitoring as any).connectedClients.add(mockWebSocket);

            // Simulate a metrics update
            const mockMetricsDoc = {
                exists: true,
                data: () => ({
                    totalAttempts: 100,
                    successfulPayments: 80,
                    failedPayments: 20
                })
            };

            // Trigger the metrics snapshot listener
            const onSnapshotCallback = (adminDb.collection().doc().onSnapshot as jest.Mock)
                .mock.calls[0][0];
            onSnapshotCallback(mockMetricsDoc);

            expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"metric_update"'));
            expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining('"totalAttempts":100'));
        });
    });
});
