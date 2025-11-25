/**
 * Progressive Web App (PWA) Service
 * Handles service worker registration, installation prompts, and offline functionality
 */

export interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  installPromptEvent: InstallPromptEvent | null;
}

class PWAService {
  private installPromptEvent: InstallPromptEvent | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private statusCallbacks: Array<(status: PWAStatus) => void> = [];

  constructor() {
    this.init();
  }

  /**
   * Initialize PWA functionality
   */
  private async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e as InstallPromptEvent;
      this.notifyStatusChange();
      console.log('PWA: Install prompt available');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.notifyStatusChange();
      console.log('PWA: App installed successfully');
      
      // Track installation
      this.trackEvent('pwa_installed');
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.notifyStatusChange();
      console.log('PWA: Back online');
    });

    window.addEventListener('offline', () => {
      this.notifyStatusChange();
      console.log('PWA: Gone offline');
    });

    // Register service worker
    await this.registerServiceWorker();

    // Check if already installed
    if (this.isStandalone()) {
      console.log('PWA: App is running in standalone mode');
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('PWA: Service workers not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('PWA: Service worker registered successfully');

      // Listen for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New version available');
              this.showUpdateAvailable();
            }
          });
        }
      });

      this.notifyStatusChange();
    } catch (error) {
      console.error('PWA: Service worker registration failed:', error);
    }
  }

  /**
   * Prompt user to install the app
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.log('PWA: Install prompt not available');
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const result = await this.installPromptEvent.userChoice;
      
      console.log('PWA: Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.trackEvent('pwa_install_accepted');
        return true;
      } else {
        this.trackEvent('pwa_install_dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Backwards-compatible wrapper expected by tests: `installApp`
   */
  async installApp(): Promise<{ success: boolean; error?: string }> {
    if (!this.installPromptEvent) {
      return { success: false, error: 'No install prompt available' };
    }

    try {
      const accepted = await this.promptInstall();
      return { success: !!accepted };
    } catch (error: any) {
      return { success: false, error: String(error?.message ?? error) };
    }
  }

  /**
   * Check if the app is installable
   */
  isInstallable(): boolean {
    return this.installPromptEvent !== null;
  }

  /**
   * Check if the app is already installed/running in standalone mode
   */
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;

    const hasMatchMedia = typeof window.matchMedia === 'function';

    return (
      (hasMatchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'))
    );
  }

  /**
   * Get current PWA status
   */
  getStatus(): PWAStatus {
    return {
      isInstalled: this.isStandalone(),
      isInstallable: this.isInstallable(),
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      isServiceWorkerRegistered: this.serviceWorkerRegistration !== null,
      installPromptEvent: this.installPromptEvent
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable(): void {
    // In a real implementation, this would show a toast or modal
    console.log('PWA: Update available');
    
    // You could dispatch a custom event or call a callback
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      await this.serviceWorkerRegistration.update();
      console.log('PWA: Service worker updated');
    } catch (error) {
      console.error('PWA: Service worker update failed:', error);
    }
  }

  /**
   * Notify all callbacks of status change
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }

  /**
   * Track PWA events for analytics
   */
  private trackEvent(event: string): void {
    // In a real implementation, this would send to your analytics service
    console.log('PWA Event:', event);
    
    // Example: Google Analytics
    if (typeof gtag !== 'undefined') {
      (gtag as any)('event', event, {
        event_category: 'PWA',
        event_label: 'CoinBox AI'
      });
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates(): Promise<{ hasUpdate: boolean }> {
    if (!this.serviceWorkerRegistration) return { hasUpdate: false };

    try {
      await this.serviceWorkerRegistration.update();

      // If `waiting` exists it means update available; otherwise return true as updated
      const hasUpdate = !!(this.serviceWorkerRegistration && (this.serviceWorkerRegistration as any).waiting);
      return { hasUpdate };
    } catch (error) {
      console.error('PWA: Check for updates failed:', error);
      return { hasUpdate: false };
    }
  }

  /**
   * Subscribe to push notifications via the service worker registration
   */
  async subscribeToPushNotifications(): Promise<{ success: boolean; subscription?: any; error?: string }> {
    if (!this.serviceWorkerRegistration) {
      return { success: false, error: 'Service worker not registered' };
    }

    try {
      const pushManager = (this.serviceWorkerRegistration as any).pushManager;
      if (!pushManager || typeof pushManager.subscribe !== 'function') {
        return { success: false, error: 'Push manager not available' };
      }

      const subscription = await pushManager.subscribe({ userVisibleOnly: true });
      return { success: true, subscription };
    } catch (error: any) {
      return { success: false, error: String(error?.message ?? error) };
    }
  }

  /**
   * Sync local data when online (graceful fallback in tests)
   */
  async syncData(): Promise<{ success: boolean; synced?: number; error?: string }> {
    try {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!online) {
        // In offline mode, return a graceful result
        return { success: false, error: 'Offline' };
      }

      // In a real implementation, sync queued requests here
      return { success: true, synced: 0 };
    } catch (error: any) {
      return { success: false, error: String(error?.message ?? error) };
    }
  }

  /**
   * Cache given resources (best-effort; no-op in non-browser env)
   */
  async cacheResources(resources: string[]): Promise<{ success: boolean; cached?: number; error?: string }> {
    try {
      if (typeof caches === 'undefined') {
        return { success: false, error: 'Cache API not available' };
      }

      const cache = await caches.open('coinbox-assets');
      await cache.addAll(resources);
      return { success: true, cached: resources.length };
    } catch (error: any) {
      return { success: false, error: String(error?.message ?? error) };
    }
  }

  async clearCache(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof caches === 'undefined') {
        return { success: false, error: 'Cache API not available' };
      }

      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: String(error?.message ?? error) };
    }
  }

  /**
   * Get app info
   */
  getAppInfo(): {
    name: string;
    version: string;
    isInstalled: boolean;
    installDate?: Date;
  } {
    return {
      name: 'CoinBox AI',
      version: '1.0.0',
      isInstalled: this.isStandalone(),
      installDate: this.isStandalone() ? new Date() : undefined
    };
  }

  /**
   * Handle app launch
   */
  handleAppLaunch(): void {
    console.log('PWA: App launched');
    
    // Track launch
    this.trackEvent('pwa_launched');
    
    // Check for updates on launch
    this.checkForUpdates();
  }

  /**
   * Show install banner
   */
  showInstallBanner(): HTMLElement | null {
    if (!this.isInstallable() || this.isStandalone()) {
      return null;
    }

    // Create install banner element
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #193281, #5e17eb);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideUp 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="flex: 1;">
        <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Install CoinBox AI</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Add to home screen for quick access</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-install-dismiss" style="
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        ">Later</button>
        <button id="pwa-install-button" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Install</button>
      </div>
    `;

    // Add event listeners
    banner.querySelector('#pwa-install-button')?.addEventListener('click', async () => {
      await this.promptInstall();
      banner.remove();
    });

    banner.querySelector('#pwa-install-dismiss')?.addEventListener('click', () => {
      banner.remove();
      // Remember dismissal for this session
      sessionStorage.setItem('pwa-banner-dismissed', 'true');
    });

    // Add styles for animation
    if (!document.getElementById('pwa-styles')) {
      const styles = document.createElement('style');
      styles.id = 'pwa-styles';
      styles.textContent = `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    // Check if banner was dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) {
      return null;
    }

    document.body.appendChild(banner);
    return banner;
  }

  /**
   * Get offline capabilities
   */
  getOfflineCapabilities(): {
    canWorkOffline: boolean;
    cachedPages: string[];
    cacheSize: number;
  } {
    return {
      canWorkOffline: this.serviceWorkerRegistration !== null,
      cachedPages: [
        '/',
        '/dashboard',
        '/dashboard/trading',
        '/dashboard/wallet',
        '/dashboard/referral'
      ],
      cacheSize: 0 // Would be calculated from actual cache
    };
  }
}

export const pwaService = new PWAService();
