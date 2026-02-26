"use client"

import { useState, useEffect, useCallback } from "react";

/**
 * SSR-safe hook to persist and hydrate state in localStorage.
 * Returns [value, setValue] — identical signature to useState.
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Hydrate from localStorage after mount (client-only)
    useEffect(() => {
        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                setStoredValue(JSON.parse(item) as T);
            }
        } catch (error) {
            console.error(`[useLocalStorage] Failed to read key "${key}":`, error);
        }
    }, [key]);

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setStoredValue((prev) => {
                const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
                try {
                    localStorage.setItem(key, JSON.stringify(next));
                } catch (error) {
                    console.error(`[useLocalStorage] Failed to write key "${key}":`, error);
                }
                return next;
            });
        },
        [key]
    );

    return [storedValue, setValue];
}
