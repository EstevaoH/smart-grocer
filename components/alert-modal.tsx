"use client"

import { AlertCircle, X } from "lucide-react";

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "error" | "warning" | "info";
    onClose: () => void;
}

export function AlertModal({
    isOpen,
    title,
    message,
    confirmLabel = "Entendido",
    variant = "error",
    onClose,
}: AlertModalProps) {
    if (!isOpen) return null;

    const iconColor =
        variant === "error"
            ? "text-red-500"
            : variant === "warning"
                ? "text-yellow-500"
                : "text-blue-500";

    const iconBg =
        variant === "error"
            ? "bg-red-50"
            : variant === "warning"
                ? "bg-yellow-50"
                : "bg-blue-50";

    const btnColor =
        variant === "error"
            ? "bg-red-500 hover:bg-red-600"
            : variant === "warning"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-500 hover:bg-blue-600";

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${iconBg}`}>
                            <AlertCircle size={18} className={iconColor} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Mensagem */}
                <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{message}</p>

                {/* Ação */}
                <div className="px-5 pb-5">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 px-4 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 active:scale-95 ${btnColor}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
