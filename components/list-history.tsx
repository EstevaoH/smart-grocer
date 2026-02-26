"use client"

import { useState } from "react";
import {
    Clock, ChevronDown, ChevronUp, RotateCcw, Trash2, Download,
    ShoppingCart, CheckCircle2, DollarSign, PackageOpen, Pencil, Check, X
} from "lucide-react";
import { ItemStatus } from "@/types/shopping-item";
import { ListSnapshot } from "@/types/list-history";

interface ListHistoryProps {
    history: ListSnapshot[];
    onRestore: (snapshot: ListSnapshot) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, newLabel: string) => void;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
}

function exportSnapshotCSV(snapshot: ListSnapshot) {
    const header = "Produto,Categoria,Quantidade,Preço,Status\n";
    const rows = snapshot.items.map(i =>
        `"${i.name}","${i.category || "Outros"}","${i.quantity || ""}","${(i.price || 0).toFixed(2)}","${i.status === ItemStatus.COMPLETED ? "Comprado" : "Pendente"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${snapshot.label.replace(/\s+/g, "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
}

function SnapshotCard({ snapshot, onRestore, onDelete, onRename }: {
    snapshot: ListSnapshot;
    onRestore: (s: ListSnapshot) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, label: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [labelDraft, setLabelDraft] = useState(snapshot.label);

    const completedCount = snapshot.items.filter(i => i.status === ItemStatus.COMPLETED).length;
    const pct = snapshot.items.length > 0 ? (completedCount / snapshot.items.length) * 100 : 0;

    const saveLabel = () => {
        onRename(snapshot.id, labelDraft.trim() || snapshot.label);
        setEditing(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <div className="flex items-center gap-1.5 mb-1">
                                <input
                                    autoFocus
                                    value={labelDraft}
                                    onChange={e => setLabelDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditing(false); }}
                                    className="flex-1 px-2.5 py-1 text-sm font-semibold border-2 border-primary rounded-lg outline-none text-gray-800"
                                />
                                <button onClick={saveLabel} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                                <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 mb-1">
                                <h3 className="text-sm font-semibold text-gray-800 truncate">{snapshot.label}</h3>
                                <button onClick={() => setEditing(true)} className="shrink-0 p-0.5 text-gray-300 hover:text-gray-500 transition-colors">
                                    <Pencil size={12} />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} /> {formatDate(snapshot.archivedAt)}
                        </p>
                    </div>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <ShoppingCart size={12} className="text-blue-400" />
                        {snapshot.items.length} item{snapshot.items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        {completedCount} comprado{completedCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <DollarSign size={12} className="text-violet-400" />
                        R$ {fmt(snapshot.totalPlanned)}
                    </span>
                    {snapshot.totalSpent > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            Gasto: R$ {fmt(snapshot.totalSpent)}
                        </span>
                    )}
                </div>

                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% comprado</p>

                <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                        onClick={() => onRestore(snapshot)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                        <RotateCcw size={12} /> Restaurar
                    </button>
                    <button
                        onClick={() => exportSnapshotCSV(snapshot)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                        <Download size={12} /> CSV
                    </button>
                    <button
                        onClick={() => onDelete(snapshot.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors ml-auto"
                    >
                        <Trash2 size={12} /> Excluir
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Itens arquivados</p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {snapshot.items.map(item => (
                            <div key={item.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${item.status === ItemStatus.COMPLETED ? "bg-emerald-50/60" : "bg-white"}`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === ItemStatus.COMPLETED ? "bg-emerald-400" : "bg-amber-300"}`} />
                                <span className={`flex-1 text-xs truncate ${item.status === ItemStatus.COMPLETED ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                                    {item.name}
                                </span>
                                {item.quantity && <span className="text-xs text-gray-400 shrink-0">{item.quantity}</span>}
                                {item.price ? (
                                    <span className="text-xs font-semibold text-gray-600 shrink-0">R$ {fmt(item.price)}</span>
                                ) : null}
                                <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded-full ${item.category ? "bg-gray-100 text-gray-500" : "text-gray-300"}`}>
                                    {item.category || ""}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ListHistory({ history, onRestore, onDelete, onRename }: ListHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-3">
                <PackageOpen className="w-14 h-14 opacity-15" />
                <p className="text-lg font-medium text-gray-500">Nenhuma lista arquivada</p>
                <p className="text-sm max-w-xs">
                    Quando terminar suas compras, clique em <span className="font-semibold text-gray-600">Arquivar lista</span> para salvar um histórico.
                </p>
            </div>
        );
    }

    const sorted = [...history].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium">
                    {history.length} lista{history.length !== 1 ? "s" : ""} arquivada{history.length !== 1 ? "s" : ""}
                </p>
            </div>
            {sorted.map(snapshot => (
                <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    onRestore={onRestore}
                    onDelete={onDelete}
                    onRename={onRename}
                />
            ))}
        </div>
    );
}
