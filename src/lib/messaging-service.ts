/**
 * Real-Time Messaging Service
 * Handles in-app messaging between users for P2P trades
 */

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Timestamp;
  read: boolean;
  edited?: boolean;
  editedAt?: Timestamp;
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  participantNames: { [userId: string]: string };
  participantAvatars?: { [userId: string]: string };
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  lastMessageSenderId?: string;
  unreadCount: { [userId: string]: number };
  tradeTicketId?: string; // Optional: link to specific trade
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived?: { [userId: string]: boolean };
  blocked?: { [userId: string]: boolean };
}

class MessagingService {
  private db = getFirestore();

  /**
   * Create or get existing conversation between two users
   */
  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    userName: string,
    otherUserName: string,
    tradeTicketId?: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(this.db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      
      // Find existing conversation with both users
      const existingConv = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(otherUserId);
      });

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const newConversation: Omit<Conversation, 'id'> = {
        participants: [userId, otherUserId],
        participantNames: {
          [userId]: userName,
          [otherUserId]: otherUserName,
        },
        unreadCount: {
          [userId]: 0,
          [otherUserId]: 0,
        },
        tradeTicketId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(conversationsRef, newConversation);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
    fileData?: { url: string; name: string; size: number }
  ): Promise<string> {
    try {
      const messagesRef = collection(this.db, 'messages');
      
      const message: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        senderName,
        recipientId,
        content,
        type,
        timestamp: serverTimestamp() as Timestamp,
        read: false,
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileSize: fileData.size,
        }),
      };

      const docRef = await addDoc(messagesRef, message);

      // Update conversation with last message
      const conversationRef = doc(this.db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: type === 'text' ? content : `Sent a ${type}`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp(),
        [`unreadCount.${recipientId}`]: (await getDoc(conversationRef)).data()?.unreadCount?.[recipientId] || 0 + 1,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      // Get unread messages
      const messagesRef = collection(this.db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);

      // Mark all as read
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      // Reset unread count
      const conversationRef = doc(this.db, 'conversations', conversationId);
      batch.update(conversationRef, {
        [`unreadCount.${userId}`]: 0,
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Subscribe to messages in a conversation (real-time)
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesRef = collection(this.db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Message));

      callback(messages);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to user's conversations (real-time)
   */
  subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const conversationsRef = collection(this.db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations: Conversation[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Conversation))
        .filter(conv => !conv.archived?.[userId]); // Filter archived conversations

      callback(conversations);
    });

    return unsubscribe;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.db, 'messages', messageId);
      await updateDoc(messageRef, {
        deleted: true,
        content: 'This message was deleted',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      const messageRef = doc(this.db, 'messages', messageId);
      await updateDoc(messageRef, {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationRef = doc(this.db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`archived.${userId}`]: true,
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw new Error('Failed to archive conversation');
    }
  }

  /**
   * Block a user in conversation
   */
  async blockUser(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationRef = doc(this.db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`blocked.${userId}`]: true,
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error('Failed to block user');
    }
  }

  /**
   * Get total unread message count for user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const conversationsRef = collection(this.db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      let total = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        total += data.unreadCount?.[userId] || 0;
      });

      return total;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const messagingService = new MessagingService();
