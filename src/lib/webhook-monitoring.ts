import { WebSocketServer } from 'ws';
import { Server } from 'http';

// Defer resolving adminDb until runtime to avoid top-level require errors
// in test environments where the admin SDK or local firebase-admin bridge
// may not be resolvable at module-load time.
function resolveAdminDb() {
    try {
        // Try alias first (mocked in tests)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('@/lib/firebase-admin');
        if (mod && mod.adminDb) return mod.adminDb;
    } catch (e) {}

    // Try local file path
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('./firebase-admin');
        if (mod && mod.adminDb) return mod.adminDb;
    } catch (e) {}

    // Fall back to any global-provided adminDb (test setup may expose this)
    if ((globalThis as any).adminDb) return (globalThis as any).adminDb;

    return null;
}

class WebhookMonitoring {
    private wss: WebSocketServer | null = null;
    private connectedClients: Set<WebSocket> = new Set();

    initialize(server: Server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket) => {
            this.connectedClients.add(ws);

            // Handle both browser WebSocket and Node.js ws package
            if (typeof ws.on === 'function') {
                ws.on('close', () => {
                    this.connectedClients.delete(ws);
                });
            } else {
                // For browser WebSocket or our mock
                ws.addEventListener?.('close', () => {
                    this.connectedClients.delete(ws);
                });
            }
        });

        // Set up Firestore listeners for real-time updates
        this.setupFirestoreListeners();
    }

    private setupFirestoreListeners() {
        const adminDb = resolveAdminDb();
        if (!adminDb) return;

        try {
            // Listen for payment events
            adminDb.collection('payment_analytics')
                .where('timestamp', '>=', new Date())
                .onSnapshot(snapshot => {
                    if (typeof snapshot.docChanges === 'function') {
                        snapshot.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                this.broadcastEvent('payment_event', {
                                    type: 'analytics',
                                    data: {
                                        id: change.doc.id,
                                        ...change.doc.data()
                                    }
                                });
                            }
                        });
                    }
                });

            // Listen for metric updates
            adminDb.collection('payment_metrics')
                .doc('global')
                .onSnapshot(doc => {
                    if (doc.exists || doc.exists === true || typeof doc.exists === 'function' && doc.exists()) {
                        this.broadcastEvent('metric_update', {
                            type: 'metrics',
                            data: typeof doc.data === 'function' ? doc.data() : doc.data
                        });
                    }
                });
        } catch (error) {
            console.error('Error setting up Firebase listeners:', error);
        }
    }

    private broadcastEvent(eventType: string, data: any) {
        const message = JSON.stringify({
            type: eventType,
            timestamp: new Date().toISOString(),
            data
        });

        for (const client of this.connectedClients) {
            // Check for OPEN state (1) and prevent sending to closed connections (3)
            if ((client as any).readyState === 1) {
                // 1 is WebSocket.OPEN
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Failed to send websocket message:', error);
                    // Remove failed client
                    this.connectedClients.delete(client);
                }
            } else if ((client as any).readyState === 3) {
                // 3 is WebSocket.CLOSED
                // Remove closed client from set
                this.connectedClients.delete(client);
            }
        }
    }

    public broadcastPaymentEvent(eventData: any) {
        this.broadcastEvent('payment_event', eventData);
    }
}

export const webhookMonitoring = new WebhookMonitoring();
