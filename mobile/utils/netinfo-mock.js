/**
 * Lightweight mock for @react-native-community/netinfo.
 * Pusher-js imports this to detect network changes. Since this is
 * a CommonJS module (plain .js), Metro can resolve it reliably.
 *
 * We always report the device as online — sufficient for Pusher's
 * internal connection logic in development.
 */

const onlineState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
};

const NetInfo = {
  fetch: () => Promise.resolve(onlineState),

  addEventListener: (handler) => {
    // Immediately invoke with "online" state and return unsubscribe fn
    if (typeof handler === 'function') {
      setTimeout(() => handler(onlineState), 0);
    }
    return () => {};
  },

  removeEventListener: () => {},

  useNetInfo: () => onlineState,
};

module.exports = NetInfo;
module.exports.default = NetInfo;
