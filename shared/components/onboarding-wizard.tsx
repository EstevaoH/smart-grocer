"use client"

import { useState } from "react";
import {
    ChevronRight, ChevronLeft, Check, ShoppingBasket, Sparkles, Plus, X
} from "lucide-react";
import { DEFAULT_CATEGORIES, UserProfile } from "@/types/user-profile";

interface OnboardingWizardProps {
    onComplete: (profile: Partial<UserProfile>) => void;
}

const EMOJI_OPTIONS = ["🛒", "👤", "🥦", "🍕", "🛍️", "👨‍🍳", "🏠", "💪", "🌟", "🎯"];
const CURRENCIES = [
    { code: "BRL" as const, label: "Real Brasileiro", symbol: "R$", flag: "🇧🇷" },
    { code: "USD" as const, label: "Dólar Americano", symbol: "$", flag: "🇺🇸" },
    { code: "EUR" as const, label: "Euro", symbol: "€", flag: "🇪🇺" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("🛒");
    const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR">("BRL");
    const [budget, setBudget] = useState("");
    const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
    const [newCat, setNewCat] = useState("");

    const TOTAL_STEPS = 3;
    const progress = ((step + 1) / TOTAL_STEPS) * 100;

    const handleComplete = () => {
        onComplete({
            name: name.trim() || "Usuário",
            emoji,
            currency,
            budgetGoal: parseFloat(budget) || 0,
            defaultCategories: categories,
            setupCompleted: true,
        });
    };

    const addCategory = () => {
        const trimmed = newCat.trim();
        if (trimmed && !categories.includes(trimmed)) {
            setCategories(prev => [...prev, trimmed]);
        }
        setNewCat("");
    };

    const removeCategory = (cat: string) => setCategories(prev => prev.filter(c => c !== cat));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-6 sm:p-8">
                    {/* Header icon */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-tr from-primary to-emerald-300 p-3 rounded-2xl shadow-lg shadow-emerald-200">
                            <ShoppingBasket className="text-white w-7 h-7" />
                        </div>
                    </div>

                    {/* Step counter */}
                    <p className="text-center text-xs text-gray-400 font-medium mb-1">
                        Passo {step + 1} de {TOTAL_STEPS}
                    </p>

                    {/* ── STEP 0: Nome + Emoji ── */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">Bem-vindo ao SmartGrocer!</h2>
                                <p className="text-sm text-gray-500 mt-1">Vamos personalizar sua experiência em 3 passos.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Seu nome</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Estevão"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && setStep(1)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none text-gray-800 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Escolha seu avatar</label>
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_OPTIONS.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => setEmoji(e)}
                                            className={`w-11 h-11 text-2xl rounded-xl border-2 transition-all ${emoji === e ? "border-primary bg-emerald-50 scale-110" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Moeda + Orçamento ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">Preferências</h2>
                                <p className="text-sm text-gray-500 mt-1">Escolha sua moeda e um orçamento mensal.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Moeda</label>
                                <div className="space-y-2">
                                    {CURRENCIES.map(c => (
                                        <button
                                            key={c.code}
                                            onClick={() => setCurrency(c.code)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${currency === c.code ? "border-primary bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                                        >
                                            <span className="text-xl">{c.flag}</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800">{c.symbol} — {c.label}</p>
                                            </div>
                                            {currency === c.code && <Check size={16} className="text-primary shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                    Orçamento mensal <span className="text-gray-400 font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                                        {CURRENCIES.find(c => c.code === currency)?.symbol}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={budget}
                                        onChange={e => setBudget(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white outline-none text-gray-800 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Categorias ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">Categorias</h2>
                                <p className="text-sm text-gray-500 mt-1">Personalize as categorias da sua lista.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Nova categoria..."
                                    value={newCat}
                                    onChange={e => setNewCat(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addCategory()}
                                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 outline-none text-sm text-gray-800 transition-all"
                                />
                                <button
                                    onClick={addCategory}
                                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-emerald-600 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                {categories.map(cat => (
                                    <span
                                        key={cat}
                                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full"
                                    >
                                        {cat}
                                        <button onClick={() => removeCategory(cat)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">{categories.length} categorias configuradas</p>
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex gap-3 mt-7">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <ChevronLeft size={16} /> Voltar
                            </button>
                        ) : (
                            <button
                                onClick={() => onComplete({ setupCompleted: true })}
                                className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Pular
                            </button>
                        )}
                        <button
                            onClick={() => step < TOTAL_STEPS - 1 ? setStep(s => s + 1) : handleComplete()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-emerald-400 text-white font-bold rounded-xl shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            {step < TOTAL_STEPS - 1 ? (
                                <><span>Próximo</span><ChevronRight size={16} /></>
                            ) : (
                                <><Sparkles size={16} /><span>Começar!</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
