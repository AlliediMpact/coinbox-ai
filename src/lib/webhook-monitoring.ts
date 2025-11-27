import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { getAdminDb } from './admin-bridge';

class WebhookMonitoring {
    private wss: WebSocketServer | null = null;
    private connectedClients: Set<any> = new Set();

    initialize(server: Server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: any) => {
            this.connectedClients.add(ws);
            ws.on('close', () => {
                this.connectedClients.delete(ws);
            });
        });
        console.log('WebSocket server for webhook monitoring initialized');
        this.setupFirestoreListeners();
    }


    private setupFirestoreListeners() {
        const adminDb = getAdminDb();
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

    get websocketServer() {
        return this.wss;
    }
}

export const webhookMonitoring = new WebhookMonitoring();

