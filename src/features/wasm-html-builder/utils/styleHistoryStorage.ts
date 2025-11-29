import { HtmlBuilderWasm } from '../module/wasm-interface';

const STORAGE_KEY = 'wasm-builder-style-history';

/**
 * Save style history to localStorage
 */
export const saveHistoryToStorage = (wasmEngine: HtmlBuilderWasm): void => {
    try {
        const compressed = wasmEngine.exportStyleHistory();
        if (compressed) {
            localStorage.setItem(STORAGE_KEY, compressed);
        }
    } catch (error) {
        console.error('Failed to save style history to localStorage:', error);
    }
};

/**
 * Load style history from localStorage
 */
export const loadHistoryFromStorage = (wasmEngine: HtmlBuilderWasm): boolean => {
    try {
        const compressed = localStorage.getItem(STORAGE_KEY);
        if (compressed) {
            return wasmEngine.importStyleHistory(compressed);
        }
        return false;
    } catch (error) {
        console.error('Failed to load style history from localStorage:', error);
        return false;
    }
};

/**
 * Clear style history from localStorage
 */
export const clearHistoryFromStorage = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear style history from localStorage:', error);
    }
};

/**
 * Get storage size in bytes
 */
export const getStorageSize = (): number => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? new Blob([data]).size : 0;
    } catch (error) {
        console.error('Failed to get storage size:', error);
        return 0;
    }
};

/**
 * Export history as downloadable file
 */
export const exportHistoryToFile = (wasmEngine: HtmlBuilderWasm): void => {
    try {
        const compressed = wasmEngine.exportStyleHistory();
        if (!compressed) {
            console.warn('No style history to export');
            return;
        }

        const blob = new Blob([compressed], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `style-history-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to export history to file:', error);
    }
};

/**
 * Import history from file
 */
export const importHistoryFromFile = (
    file: File,
    wasmEngine: HtmlBuilderWasm
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result as string;
                const success = wasmEngine.importStyleHistory(data);
                if (success) {
                    saveHistoryToStorage(wasmEngine);
                }
                resolve(success);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};
