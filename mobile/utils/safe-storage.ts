import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A safe wrapper around AsyncStorage that handles cases where the native module is null.
 * This is particularly useful in experimental Expo/RN environments (like Expo 54) 
 * where native module resolution might fail.
 */

class InMemoryStorage {
  private storage: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.storage[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
  }

  async clear(): Promise<void> {
    this.storage = {};
  }

  async getAllKeys(): Promise<string[]> {
    return Object.keys(this.storage);
  }
}

const memoryStorage = new InMemoryStorage();

const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`[SafeStorage] Falling back to memory for getItem('${key}')`);
        return await memoryStorage.getItem(key);
      }
      throw error;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`[SafeStorage] Falling back to memory for setItem('${key}')`);
        await memoryStorage.setItem(key, value);
        return;
      }
      throw error;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn(`[SafeStorage] Falling back to memory for removeItem('${key}')`);
        await memoryStorage.removeItem(key);
        return;
      }
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn('[SafeStorage] Falling back to memory for clear()');
        await memoryStorage.clear();
        return;
      }
      throw error;
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      return (await AsyncStorage.getAllKeys()) as string[];
    } catch (error: any) {
      if (error?.message?.includes('Native module is null')) {
        console.warn('[SafeStorage] Falling back to memory for getAllKeys()');
        return await memoryStorage.getAllKeys();
      }
      throw error;
    }
  }
};

export default SafeStorage;
