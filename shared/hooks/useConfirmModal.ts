"use client"

import { useState, useCallback } from "react";

interface ConfirmModalConfig {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
}

interface ConfirmModalState extends ConfirmModalConfig {
    isOpen: boolean;
}

const INITIAL_STATE: ConfirmModalState = {
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
};

export function useConfirmModal() {
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(INITIAL_STATE);

    const openConfirm = useCallback((config: ConfirmModalConfig) => {
        setConfirmModal({ isOpen: true, ...config });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return { confirmModal, openConfirm, closeConfirm };
}
