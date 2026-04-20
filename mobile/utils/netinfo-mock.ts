/**
 * Mock for @react-native-community/netinfo
 * Provides stub implementations so pusher-js can load in Expo Go
 * without requiring a native rebuild.
 */
const NetInfo = {
  fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  addEventListener: (_: string, handler: (state: any) => void) => {
    // Immediately call with online state
    setTimeout(() => handler({ isConnected: true, isInternetReachable: true }), 0);
    // Return unsubscribe function
    return () => {};
  },
  removeEventListener: () => {},
};

export default NetInfo;
