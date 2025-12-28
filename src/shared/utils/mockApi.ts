// src/shared/utils/mockApi.ts
// NyayaSahayak Hybrid - Zero-Dormant Mock API Utilities
// PURPOSE: Simulates network latency to force "Loading/Success/Error" states

/**
 * Simulates network delay for mock API calls
 * @param ms - Delay in milliseconds
 */
export const mockDelay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates an API call with configurable success rate
 * @param successRate - Probability of success (0-1)
 * @param delayMs - Simulated network latency
 * @returns Promise that resolves on success, rejects on failure
 */
export const mockApiCall = async <T>(
    data: T,
    delayMs: number = 1000,
    successRate: number = 0.95
): Promise<T> => {
    await mockDelay(delayMs);

    if (Math.random() > successRate) {
        throw new Error('Network request failed. Please try again.');
    }

    return data;
};

/**
 * Debounce helper to prevent rapid button clicks
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
