import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { adminDb } from './firebase-admin';

class WebhookMonitoring {
    private wss: WebSocketServer | null = null;
    private connectedClients: Set<WebSocket> = new Set();

    initialize(server: Server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket) => {
            this.connectedClients.add(ws);

            ws.on('close', () => {
                this.connectedClients.delete(ws);
            });
        });

        // Set up Firestore listeners for real-time updates
        this.setupFirestoreListeners();
    }

    private setupFirestoreListeners() {
        if (!adminDb) return;

        // Listen for payment events
        adminDb.collection('payment_analytics')
            .where('timestamp', '>=', new Date())
            .onSnapshot(snapshot => {
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
            });

        // Listen for metric updates
        adminDb.collection('payment_metrics')
            .doc('global')
            .onSnapshot(doc => {
                if (doc.exists) {
                    this.broadcastEvent('metric_update', {
                        type: 'metrics',
                        data: doc.data()
                    });
                }
            });
    }

    private broadcastEvent(eventType: string, data: any) {
        const message = JSON.stringify({
            type: eventType,
            timestamp: new Date().toISOString(),
            data
        });

        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    public broadcastPaymentEvent(eventData: any) {
        this.broadcastEvent('payment_event', eventData);
    }
}

export const webhookMonitoring = new WebhookMonitoring();
