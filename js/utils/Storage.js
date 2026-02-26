/**
 * Storage Utility - LocalStorage wrapper with JSON serialization
 */

export class Storage {
    constructor(namespace = 'lateness-tracker') {
        this.namespace = namespace;
    }

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    set(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(`${this.namespace}:${key}`, serialized);
            return true;
        } catch (error) {
            console.error(`Storage error: ${key}`, error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default if not found
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`${this.namespace}:${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Storage read error: ${key}`, error);
            return defaultValue;
        }
    }

    /**
     * Remove a key
     * @param {string} key - Storage key
     */
    remove(key) {
        localStorage.removeItem(`${this.namespace}:${key}`);
    }

    /**
     * Export all data as JSON
     * @returns {object}
     */
    exportAll() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.namespace}:`)) {
                const shortKey = key.replace(`${this.namespace}:`, '');
                data[shortKey] = this.get(shortKey);
            }
        }
        return data;
    }

    /**
     * Import data from JSON
     * @param {object} data - Data to import
     */
    importAll(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Clear all app data
     */
    clearAll() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.namespace}:`)) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
    }
}
