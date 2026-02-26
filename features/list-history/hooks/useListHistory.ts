"use client"

import { useCallback, useRef, useState } from "react";
import { ListSnapshot, createSnapshot, loadHistory, saveHistory } from "@/types/list-history";
import { ShoppingItem } from "@/types/shopping-item";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";

const STORAGE_HISTORY_KEY = "smartgrocer_history_v1";

export function useListHistory(
    items: ShoppingItem[],
    showNotification: (msg: string) => void,
    openConfirm: (cfg: {
        title: string;
        message: string;
        confirmLabel?: string;
        variant?: "danger" | "warning";
        onConfirm: () => void;
    }) => void,
    closeConfirm: () => void,
    onRestore: (items: ShoppingItem[]) => void
) {
    const [history, setHistory] = useLocalStorage<ListSnapshot[]>(
        STORAGE_HISTORY_KEY,
        []
    );
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archiveLabel, setArchiveLabel] = useState("");
    const archiveLabelRef = useRef<HTMLInputElement>(null);

    const persistHistory = useCallback(
        (h: ListSnapshot[]) => {
            setHistory(h);
            saveHistory(h);
        },
        [setHistory]
    );

    const handleArchive = useCallback(() => {
        if (items.length === 0) return;
        const snapshot = createSnapshot(items, archiveLabel);
        persistHistory([...history, snapshot]);
        setShowArchiveModal(false);
        setArchiveLabel("");
        showNotification(`"${snapshot.label}" arquivada!`);
    }, [items, archiveLabel, history, persistHistory, showNotification]);

    const handleRestore = useCallback(
        (snapshot: ListSnapshot) => {
            openConfirm({
                title: "Restaurar lista",
                message: `Deseja substituir a lista atual pelos ${snapshot.items.length} itens de "${snapshot.label}"?`,
                confirmLabel: "Restaurar",
                variant: "warning",
                onConfirm: () => {
                    onRestore(snapshot.items.map((i) => ({ ...i })));
                    closeConfirm();
                    showNotification(`Lista "${snapshot.label}" restaurada!`);
                },
            });
        },
        [openConfirm, closeConfirm, onRestore, showNotification]
    );

    const handleDeleteSnapshot = useCallback(
        (id: string) => {
            openConfirm({
                title: "Excluir snapshot",
                message: "Tem certeza? Esta lista arquivada será excluída permanentemente.",
                confirmLabel: "Excluir",
                variant: "danger",
                onConfirm: () => {
                    persistHistory(history.filter((h) => h.id !== id));
                    closeConfirm();
                },
            });
        },
        [history, openConfirm, closeConfirm, persistHistory]
    );

    const handleRenameSnapshot = useCallback(
        (id: string, newLabel: string) => {
            persistHistory(
                history.map((h) => (h.id === id ? { ...h, label: newLabel } : h))
            );
        },
        [history, persistHistory]
    );

    const openArchiveModal = useCallback(() => {
        setShowArchiveModal(true);
        setTimeout(() => archiveLabelRef.current?.focus(), 50);
    }, []);

    return {
        history,
        showArchiveModal,
        archiveLabel,
        archiveLabelRef,
        setArchiveLabel,
        setShowArchiveModal,
        openArchiveModal,
        handleArchive,
        handleRestore,
        handleDeleteSnapshot,
        handleRenameSnapshot,
    };
}
