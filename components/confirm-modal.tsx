"use client"

import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            {/* Modal panel */}
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${variant === "danger" ? "bg-red-50" : "bg-yellow-50"}`}>
                            {variant === "danger"
                                ? <Trash2 size={18} className="text-red-500" />
                                : <AlertTriangle size={18} className="text-yellow-500" />
                            }
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Mensagem */}
                <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{message}</p>

                {/* Ações */}
                <div className="flex gap-2 px-5 pb-5">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 cursor-pointer px-4 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 active:scale-95 ${variant === "danger"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-yellow-500 hover:bg-yellow-600"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
