import { ShoppingItem } from "./shopping-item";

export const STORAGE_HISTORY_KEY = "smartgrocer_history_v1";

export interface ListSnapshot {
    id: string;
    label: string;          // e.g. "Lista de 25/fev/25"
    archivedAt: string;     // ISO date string
    items: ShoppingItem[];
    totalPlanned: number;
    totalSpent: number;
}

export function loadHistory(): ListSnapshot[] {
    try {
        const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
        if (raw) return JSON.parse(raw) as ListSnapshot[];
    } catch { /* ignore */ }
    return [];
}

export function saveHistory(history: ListSnapshot[]): void {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
}

export function createSnapshot(items: ShoppingItem[], label?: string): ListSnapshot {
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
    return {
        id: Date.now().toString(),
        label: label?.trim() || `Lista de ${dateStr}`,
        archivedAt: now.toISOString(),
        items: [...items],
        totalPlanned: items.reduce((s, i) => s + (i.price || 0), 0),
        totalSpent: items.filter(i => i.status === "COMPLETED").reduce((s, i) => s + (i.price || 0), 0),
    };
}
