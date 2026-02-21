"use client"

import { DEFAULT_CATEGORIES, ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface AddItemProps {
    onAddItem: (item: ShoppingItem) => void
}

export function AddItem({ onAddItem }: AddItemProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [price, setPrice] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newItem: ShoppingItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: name.trim(),
            category,
            price: price ? parseFloat(price) : 0,
            status: ItemStatus.PENDING
        };

        onAddItem(newItem);
        setName('');
        setPrice('');
        setIsExpanded(false);
    };

    return (
        <div className="mb-6">
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                    <Plus size={20} />
                    Adicionar Item Manualmente
                </button>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    {/* Header do formulário com botão fechar */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Novo item</span>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Nome */}
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do item (ex: Bananas)"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            autoFocus
                        />

                        {/* Categoria + Preço lado a lado no mobile também */}
                        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="col-span-2 sm:col-auto sm:flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 text-sm"
                            >
                                {DEFAULT_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">R$</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Botão Adicionar — largura total no mobile */}
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            Adicionar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
