/**
 * Comprehensive notification type definitions and constants
 */

// All supported notification types
export type NotificationType = 
  // Existing types
  | 'trade_match'
  | 'dispute'
  | 'dispute_update'
  | 'escrow_release'
  | 'commission' 
  | 'kyc_status'
  | 'system'
  // New types
  | 'payment_receipt'
  | 'payment_failed'
  | 'payment_pending'
  | 'new_feature'
  | 'maintenance'
  | 'security_alert'
  | 'price_alert'
  | 'trade_complete'
  | 'trade_cancelled'
  | 'wallet_update'
  | 'login_alert';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high';

// Notification status
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

// Notification category for filtering
export type NotificationCategory = 
  | 'all'
  | 'transactions'
  | 'security'
  | 'system'
  | 'trades'
  | 'disputes'
  | 'account';

// Mapping notification types to categories for filtering
export const NOTIFICATION_CATEGORY_MAP: Record<NotificationType, NotificationCategory> = {
  trade_match: 'trades',
  dispute: 'disputes',
  dispute_update: 'disputes',
  escrow_release: 'transactions',
  commission: 'transactions',
  kyc_status: 'account',
  system: 'system',
  payment_receipt: 'transactions',
  payment_failed: 'transactions',
  payment_pending: 'transactions',
  new_feature: 'system',
  maintenance: 'system',
  security_alert: 'security',
  price_alert: 'trades',
  trade_complete: 'trades',
  trade_cancelled: 'trades',
  wallet_update: 'account',
  login_alert: 'security'
};

// Sound notification settings
export const NOTIFICATION_SOUNDS = {
  default: '/sounds/notification.mp3',
  success: '/sounds/success.mp3',
  warning: '/sounds/warning.mp3',
  error: '/sounds/error.mp3',
  transaction: '/sounds/transaction.mp3',
};

// Icons for different notification types
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  trade_match: 'HandshakeIcon',
  dispute: 'AlertTriangleIcon',
  dispute_update: 'ClipboardIcon',
  escrow_release: 'UnlockIcon',
  commission: 'CoinsIcon',
  kyc_status: 'ShieldCheckIcon',
  system: 'BellIcon',
  payment_receipt: 'ReceiptIcon',
  payment_failed: 'XCircleIcon',
  payment_pending: 'ClockIcon',
  new_feature: 'ZapIcon',
  maintenance: 'ToolIcon',
  security_alert: 'ShieldAlertIcon',
  price_alert: 'TrendingUpIcon',
  trade_complete: 'CheckCircleIcon',
  trade_cancelled: 'XIcon',
  wallet_update: 'WalletIcon',
  login_alert: 'LogInIcon'
};

// Default notification expiry in days
export const DEFAULT_NOTIFICATION_EXPIRY_DAYS = 30;
