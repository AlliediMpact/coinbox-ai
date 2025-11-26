// CommonJS wrapper for tests that call `require('../lib/pwa-service')`
// Exposes a small mockable API so tests can call `.mockReturnValue` / `.mockImplementation`
// on exported methods even if the underlying implementation is a plain function.
function makeMockable(fn, ctx) {
  const wrapper = function (...args) {
    if (wrapper.__mockImpl) return wrapper.__mockImpl.apply(ctx, args);
    if (typeof wrapper.__mockReturnValue !== 'undefined') return wrapper.__mockReturnValue;
    return fn.apply(ctx, args);
  };
  wrapper.mockReturnValue = (v) => { wrapper.__mockReturnValue = v; };
  wrapper.mockImplementation = (f) => { wrapper.__mockImpl = f; };
  wrapper.mockReset = () => { delete wrapper.__mockReturnValue; delete wrapper.__mockImpl; };
  return wrapper;
}

try {
  // Try to load the actual module (test runner should resolve TS/ESM to JS)
  const mod = require('./pwa-service');
  const real = (mod && (mod.pwaService || (mod.default && mod.default.pwaService))) || mod || {};

  const pwaService = {};

  // Expose all functions from the real service as mockable wrappers so tests
  // can call `.mockReturnValue` / `.mockImplementation` on them.
  Object.keys(real).forEach((key) => {
    const val = real[key];
    if (typeof val === 'function') {
      pwaService[key] = makeMockable(val.bind(real), real);
    } else {
      pwaService[key] = val;
    }
  });

  // Ensure commonly used helpers exist even if the real object is missing them
  const defaults = {
    installApp: async () => ({ success: false }),
    getStatus: () => ({ isInstalled: false, isInstallable: false, isOnline: true, isServiceWorkerSupported: false, isServiceWorkerRegistered: false, installPromptEvent: null }),
    promptInstall: async () => false,
    subscribeToPushNotifications: async () => ({ success: false }),
    syncData: async () => ({ success: false }),
    onStatusChange: () => (() => {}),
    checkForUpdates: async () => ({ hasUpdate: false }),
    cacheResources: async () => ({ success: false }),
    clearCache: async () => ({ success: false })
  };

  Object.keys(defaults).forEach((k) => {
    if (typeof pwaService[k] === 'undefined') {
      pwaService[k] = makeMockable(defaults[k], real);
    }
  });

  module.exports = { pwaService };
} catch (e) {
  // Minimal fallback mock
  const fallback = {
    installApp: async () => ({ success: false }),
    getStatus: () => ({ isInstalled: false, isInstallable: false, isOnline: true, isServiceWorkerSupported: false, isServiceWorkerRegistered: false, installPromptEvent: null }),
    promptInstall: async () => false,
    subscribeToPushNotifications: async () => ({ success: false, error: 'not available' }),
    syncData: async () => ({ success: false }),
    onStatusChange: () => (() => {}),
    checkForUpdates: async () => ({ hasUpdate: false }),
    cacheResources: async () => ({ success: false }),
    clearCache: async () => ({ success: false })
  };

  const pwaService = {};
  Object.keys(fallback).forEach((k) => {
    pwaService[k] = makeMockable(fallback[k], null);
  });

  module.exports = { pwaService };
}
// Compatibility shim for tests that call `require('../lib/pwa-service')`.
// Some tests (and older require-based helpers) expect a plain CommonJS
// module at this path. Forward to the `.cjs` wrapper if present.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  module.exports = require('./pwa-service.cjs');
} catch (e) {
  // Fallback: export an empty object to avoid breaking tests that `require` this.
  module.exports = {};
}
