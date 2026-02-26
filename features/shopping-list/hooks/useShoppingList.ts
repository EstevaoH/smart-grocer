"use client"

import { useCallback, useEffect, useState } from "react";
import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";

const STORAGE_KEY = "smartgrocer_items_v1";

export function useShoppingList() {
    const [items, setItems] = useLocalStorage<ShoppingItem[]>(STORAGE_KEY, []);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleAddItem = useCallback((newItem: ShoppingItem) => {
        setItems((prev) => [...prev, newItem]);
    }, [setItems]);

    const handleAddMultipleItems = useCallback(
        (newItems: ShoppingItem[]) => {
            setItems((prev) => {
                const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
                const now = new Date().toISOString();
                const filteredNew = newItems
                    .filter((i) => !existingNames.has(i.name.toLowerCase()))
                    .map((i) => ({ ...i, createdAt: i.createdAt ?? now }));
                return [...prev, ...filteredNew];
            });
        },
        [setItems]
    );

    const handleToggleStatus = useCallback(
        (id: string) => {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            status:
                                item.status === ItemStatus.PENDING
                                    ? ItemStatus.COMPLETED
                                    : ItemStatus.PENDING,
                        }
                        : item
                )
            );
        },
        [setItems]
    );

    const handleUpdateItem = useCallback(
        (id: string, updates: Partial<ShoppingItem>) => {
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
            );
        },
        [setItems]
    );

    const handleDeleteItem = useCallback(
        (id: string) => {
            setItems((prev) => prev.filter((item) => item.id !== id));
        },
        [setItems]
    );

    const handleClearCompleted = useCallback(() => {
        setItems((prev) => prev.filter((item) => item.status !== ItemStatus.COMPLETED));
    }, [setItems]);

    const handleClearAll = useCallback(() => {
        setItems([]);
    }, [setItems]);

    const handleRestoreItems = useCallback((restoredItems: ShoppingItem[]) => {
        setItems(restoredItems.map((i) => ({ ...i })));
    }, [setItems]);

    const handleShareList = useCallback(async (): Promise<string | null> => {
        if (items.length === 0) return "Lista vazia!";

        const groups: Record<string, ShoppingItem[]> = {};
        items.forEach((item) => {
            const cat = item.category || "Outro";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });

        let text = "🛒 *SmartGrocer List*\n\n";
        Object.keys(groups)
            .sort()
            .forEach((cat) => {
                const catItems = groups[cat];
                if (catItems.length === 0) return;
                text += `*${cat}*\n`;
                catItems.forEach((item) => {
                    const status = item.status === ItemStatus.COMPLETED ? "✅" : "⬜";
                    const qty = item.quantity ? ` (${item.quantity})` : "";
                    const price = item.price ? ` - $${item.price.toFixed(2)}` : "";
                    text += `${status} ${item.name}${qty}${price}\n`;
                });
                text += "\n";
            });

        const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
        text += `💰 *Total: R$${total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`;

        if (navigator.share) {
            try {
                await navigator.share({ title: "Lista de compras", text });
            } catch {
                // cancelled
            }
            return null;
        }

        try {
            await navigator.clipboard.writeText(text);
            return "Lista copiada para a área de transferência!";
        } catch {
            return "Falha ao copiar lista.";
        }
    }, [items]);

    // Computed values
    const completedCount = items.filter((i) => i.status === ItemStatus.COMPLETED).length;
    const totalCount = items.length;
    const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const completedPrice = items
        .filter((i) => i.status === ItemStatus.COMPLETED)
        .reduce((sum, item) => sum + (item.price || 0), 0);

    return {
        items,
        hasMounted,
        completedCount,
        totalCount,
        progress,
        totalPrice,
        completedPrice,
        handleAddItem,
        handleAddMultipleItems,
        handleToggleStatus,
        handleUpdateItem,
        handleDeleteItem,
        handleClearCompleted,
        handleClearAll,
        handleRestoreItems,
        handleShareList,
    };
}
