import { MONTH_NAMES } from "@/constants";
import { ShoppingItem } from "@/types/shopping-item";

export const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function monthLabel(key: string) {
    const [y, m] = key.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]}/${y.slice(2)}`;
}

export function itemMonthKey(item: ShoppingItem) {
    const d = item.createdAt ? new Date(item.createdAt) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function itemDayKey(item: ShoppingItem) {
    const d = item.createdAt ? new Date(item.createdAt) : new Date();
    return d.toISOString().slice(0, 10);
}

export function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }