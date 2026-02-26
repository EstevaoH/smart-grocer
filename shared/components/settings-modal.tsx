"use client"

import { useEffect, useRef, useState } from "react";
import {
    X, User, Settings, Tag, Database, Plus, Check,
    ChevronDown, Download, Trash2, Save,
} from "lucide-react";
import { CURRENCIES, UserProfile } from "@/types/user-profile";

interface SettingsModalProps {
    profile: UserProfile;
    onSave: (profile: UserProfile) => void;
    onClose: () => void;
    onClearData: () => void;
}

type SettingsTab = "perfil" | "preferencias" | "categorias" | "dados";

const EMOJI_OPTIONS = ["🛒", "👤", "🥦", "🍕", "🛍️", "👨‍🍳", "🏠", "💪", "🌟", "🎯", "🌿", "🍎", "🥕", "🧀", "🥩"];

const CURRENCY_OPTIONS = [
    { code: "BRL" as const, label: "Real (R$)", flag: "🇧🇷" },
    { code: "USD" as const, label: "Dólar ($)", flag: "🇺🇸" },
    { code: "EUR" as const, label: "Euro (€)", flag: "🇪🇺" },
];

export function SettingsModal({ profile, onSave, onClose, onClearData }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("perfil");
    const [draft, setDraft] = useState<UserProfile>({ ...profile });
    const [newCat, setNewCat] = useState("");
    const [saved, setSaved] = useState(false);
    const newCatRef = useRef<HTMLInputElement>(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleSave = () => {
        onSave(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const addCategory = () => {
        const t = newCat.trim();
        if (t && !draft.defaultCategories.includes(t)) {
            setDraft(d => ({ ...d, defaultCategories: [...d.defaultCategories, t] }));
        }
        setNewCat("");
        newCatRef.current?.focus();
    };

    const removeCategory = (cat: string) =>
        setDraft(d => ({ ...d, defaultCategories: d.defaultCategories.filter(c => c !== cat) }));

    const exportData = () => {
        const data = JSON.stringify({ profile: draft }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "smartgrocer-config.json"; a.click();
        URL.revokeObjectURL(url);
    };

    const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: "perfil", label: "Perfil", icon: <User size={15} /> },
        { id: "preferencias", label: "Preferências", icon: <Settings size={15} /> },
        { id: "categorias", label: "Categorias", icon: <Tag size={15} /> },
        { id: "dados", label: "Dados", icon: <Database size={15} /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{draft.emoji}</span>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Configurações</h2>
                            <p className="text-xs text-gray-400">{draft.name || "Usuário"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-gray-100 shrink-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* ── PERFIL ── */}
                    {activeTab === "perfil" && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome</label>
                                <input
                                    type="text"
                                    value={draft.name}
                                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                                    placeholder="Seu nome"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none text-gray-800 transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Avatar</label>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_OPTIONS.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => setDraft(d => ({ ...d, emoji: e }))}
                                            className={`w-11 h-11 text-2xl rounded-xl border-2 transition-all ${draft.emoji === e ? "border-primary bg-emerald-50 scale-110" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── PREFERÊNCIAS ── */}
                    {activeTab === "preferencias" && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Moeda</label>
                                <div className="space-y-2">
                                    {CURRENCY_OPTIONS.map(c => (
                                        <button
                                            key={c.code}
                                            onClick={() => setDraft(d => ({ ...d, currency: c.code }))}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${draft.currency === c.code ? "border-primary bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                                        >
                                            <span className="text-xl">{c.flag}</span>
                                            <span className="text-sm font-semibold text-gray-800 flex-1">{c.label}</span>
                                            {draft.currency === c.code && <Check size={15} className="text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                    Orçamento mensal <span className="text-gray-400 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                        {CURRENCIES[draft.currency]}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={draft.budgetGoal || ""}
                                        onChange={e => setDraft(d => ({ ...d, budgetGoal: parseFloat(e.target.value) || 0 }))}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none text-gray-800 transition-all text-sm"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">Também sincronizado com o Painel BI.</p>
                            </div>
                        </>
                    )}

                    {/* ── CATEGORIAS ── */}
                    {activeTab === "categorias" && (
                        <>
                            <div className="flex gap-2">
                                <input
                                    ref={newCatRef}
                                    type="text"
                                    placeholder="Nova categoria..."
                                    value={newCat}
                                    onChange={e => setNewCat(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addCategory()}
                                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 outline-none text-sm text-gray-800 transition-all"
                                />
                                <button onClick={addCategory} className="p-2.5 bg-primary text-white rounded-xl hover:bg-emerald-600 transition-colors shrink-0">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {draft.defaultCategories.map(cat => (
                                    <span key={cat} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                                        {cat}
                                        <button onClick={() => removeCategory(cat)} className="hover:text-red-500 transition-colors ml-0.5">
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">{draft.defaultCategories.length} categorias</p>
                        </>
                    )}

                    {/* ── DADOS ── */}
                    {activeTab === "dados" && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Download size={14} /> Exportar</h3>
                                <button
                                    onClick={exportData}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-primary hover:bg-emerald-50 transition-all text-sm font-medium text-gray-700 group"
                                >
                                    <span>Exportar configurações</span>
                                    <ChevronDown size={14} className="text-gray-400 group-hover:text-primary -rotate-90 transition-transform" />
                                </button>
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2"><Trash2 size={14} /> Zona de perigo</h3>
                                <p className="text-xs text-red-500">Esta ação remove todos os itens da lista. As configurações de perfil serão mantidas.</p>
                                <button
                                    onClick={onClearData}
                                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    Limpar todos os itens
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save button footer */}
                {activeTab !== "dados" && (
                    <div className="px-6 pb-6 pt-3 shrink-0 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${saved ? "bg-emerald-100 text-emerald-700" : "bg-gradient-to-r from-primary to-emerald-400 text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"}`}
                        >
                            {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> Salvar alterações</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
