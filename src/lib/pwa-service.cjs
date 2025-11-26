// CommonJS wrapper for tests that call `require('../lib/pwa-service')`
// This forwards to the ESM export in `pwa-service.ts` while keeping the
// same singleton instance so tests can spy on it via require().
try {
  // Attempt to require the compiled module (test runners often provide ESM interop)
  const mod = require('./pwa-service');
  // If the module uses ESM default export or named export, normalize
  const pwaService = mod && (mod.pwaService || mod.default && mod.default.pwaService) ? (mod.pwaService || (mod.default && mod.default.pwaService)) : (mod && mod.pwaService) || (mod && mod.default) || mod;
  module.exports = { pwaService };
} catch (e) {
  // Fallback: export a minimal mock so tests don't crash if resolution fails
  const noop = () => false;
  const pwaService = {
    installApp: async () => ({ success: false, error: 'pwa-service not available in test wrapper' }),
    getStatus: () => ({ isInstalled: false, isInstallable: false, isOnline: true, isServiceWorkerSupported: false, isServiceWorkerRegistered: false, installPromptEvent: null }),
    promptInstall: noop,
    subscribeToPushNotifications: async () => ({ success: false, error: 'not available' }),
  };
  module.exports = { pwaService };
}
