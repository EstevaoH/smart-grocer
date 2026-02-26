"use client"

import { useState, useMemo } from "react";
import { Calculator, RotateCcw, Plus, Trash2, Award } from "lucide-react";

type Unit = "g" | "kg" | "ml" | "L";
type UnitGroup = "mass" | "volume";

interface Product {
    id: number;
    label: string;
    price: string;
    quantity: string;
    unit: Unit;
}

const UNIT_META: Record<Unit, { group: UnitGroup; toBase: number; label: string }> = {
    g: { group: "mass", toBase: 0.001, label: "g" },
    kg: { group: "mass", toBase: 1, label: "kg" },
    ml: { group: "volume", toBase: 0.001, label: "ml" },
    L: { group: "volume", toBase: 1, label: "L" },
};

const REF_UNIT: Record<UnitGroup, string> = {
    mass: "kg",
    volume: "L",
};

const EMPTY_PRODUCT = (id: number): Product => ({
    id,
    label: "",
    price: "",
    quantity: "",
    unit: "kg",
});

const SLOT_COLORS = [
    { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
    { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
];

const nextId = (() => { let n = 0; return () => ++n; })();

export function PriceCalculator() {
    const [products, setProducts] = useState<Product[]>([
        EMPTY_PRODUCT(nextId()),
        EMPTY_PRODUCT(nextId()),
    ]);

    const update = (id: number, field: keyof Product, value: string) => {
        setProducts(prev =>
            prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const addSlot = () => {
        if (products.length >= 4) return;
        setProducts(prev => [...prev, EMPTY_PRODUCT(nextId())]);
    };

    const removeSlot = (id: number) => {
        if (products.length <= 2) return;
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const reset = () => {
        setProducts([EMPTY_PRODUCT(nextId()), EMPTY_PRODUCT(nextId())]);
    };

    // Compute price-per-base-unit for each product
    const results = useMemo(() => {
        return products.map(p => {
            const price = parseFloat(p.price.replace(",", "."));
            const qty = parseFloat(p.quantity.replace(",", "."));
            const meta = UNIT_META[p.unit];
            if (!isNaN(price) && !isNaN(qty) && qty > 0 && price >= 0) {
                const qtyInBase = qty * meta.toBase;
                const perUnit = price / qtyInBase;
                return { perUnit, group: meta.group, valid: true };
            }
            return { perUnit: Infinity, group: meta.group, valid: false };
        });
    }, [products]);

    // Find the best (lowest) valid result, but only among comparable units
    const bestIndex = useMemo(() => {
        // Group by unit group, find min within each group
        const validByGroup: Record<string, { idx: number; val: number }[]> = {};
        results.forEach((r, i) => {
            if (!r.valid) return;
            if (!validByGroup[r.group]) validByGroup[r.group] = [];
            validByGroup[r.group].push({ idx: i, val: r.perUnit });
        });

        let best: number | null = null;
        Object.values(validByGroup).forEach(group => {
            if (group.length < 2) return; // need at least 2 to compare
            const minVal = Math.min(...group.map(g => g.val));
            const minItem = group.find(g => g.val === minVal);
            if (minItem && (best === null || minItem.val < (results[best]?.perUnit ?? Infinity))) {
                best = minItem.idx;
            }
        });
        return best;
    }, [results]);

    const hasComparison = bestIndex !== null;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-tr from-primary to-emerald-300 p-3 rounded-xl shadow-md shadow-emerald-100 shrink-0">
                        <Calculator className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-base">Calculadora de Preço por Unidade</h2>
                        <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                            Compare produtos de tamanhos diferentes e descubra qual tem o melhor custo‑benefício real (R$/kg ou R$/L).
                        </p>
                    </div>
                </div>
            </div>

            {/* Product slots */}
            <div className="space-y-3">
                {products.map((product, index) => {
                    const result = results[index];
                    const isBest = hasComparison && bestIndex === index;
                    const color = SLOT_COLORS[index % SLOT_COLORS.length];
                    const refUnit = result.valid ? REF_UNIT[result.group] : null;

                    return (
                        <div
                            key={product.id}
                            className={`rounded-2xl border-2 p-4 transition-all duration-300 ${isBest
                                    ? "border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100"
                                    : `${color.border} ${color.bg}`
                                }`}
                        >
                            {/* Slot header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${isBest ? "bg-emerald-500" : color.dot}`} />
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Produto {index + 1}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isBest && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                            <Award size={11} />
                                            Melhor custo‑benefício
                                        </span>
                                    )}
                                    {products.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSlot(product.id)}
                                            className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Remover produto"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Label (optional) */}
                            <input
                                type="text"
                                placeholder={`Nome (ex: Sabão em pó${index === 0 ? " 1,6kg" : index === 1 ? " 2,2kg" : ""})`}
                                value={product.label}
                                onChange={e => update(product.id, "label", e.target.value)}
                                className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3 transition-all"
                            />

                            {/* Price + Quantity + Unit row */}
                            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                                {/* Price */}
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Preço</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">R$</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            placeholder="0,00"
                                            min="0"
                                            step="0.01"
                                            value={product.price}
                                            onChange={e => update(product.id, "price", e.target.value)}
                                            className="w-full pl-7 pr-2 py-2 bg-white/70 border border-white rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Quantidade</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="1"
                                        min="0"
                                        step="any"
                                        value={product.quantity}
                                        onChange={e => update(product.id, "quantity", e.target.value)}
                                        className="w-full px-3 py-2 bg-white/70 border border-white rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Unit */}
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Unidade</label>
                                    <select
                                        value={product.unit}
                                        onChange={e => update(product.id, "unit", e.target.value as Unit)}
                                        className="px-2 py-2 bg-white/70 border border-white rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="ml">ml</option>
                                        <option value="L">L</option>
                                    </select>
                                </div>
                            </div>

                            {/* Result */}
                            {result.valid && refUnit && (
                                <div className={`mt-3 px-3 py-2 rounded-xl flex items-center justify-between ${isBest ? "bg-emerald-100" : "bg-white/60"
                                    }`}>
                                    <span className="text-xs text-gray-500 font-medium">Custo por {refUnit}</span>
                                    <span className={`text-sm font-bold ${isBest ? "text-emerald-700" : "text-gray-700"}`}>
                                        R$ {result.perUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{refUnit}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                {products.length < 4 && (
                    <button
                        type="button"
                        onClick={addSlot}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium flex-1 justify-center"
                    >
                        <Plus size={16} />
                        Adicionar produto
                    </button>
                )}
                <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 text-sm font-medium transition-colors"
                >
                    <RotateCcw size={14} />
                    Limpar
                </button>
            </div>

            {/* Tip */}
            {!hasComparison && (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-400">
                        💡 Preencha o preço, quantidade e unidade de pelo menos <strong>dois produtos</strong> para ver a comparação.
                    </p>
                </div>
            )}
        </div>
    );
}
