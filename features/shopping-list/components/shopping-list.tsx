"use client"

import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { Check, Tag, Trash2 } from "lucide-react";
import { useMemo } from "react";

interface ShoppingListProps {
    items: ShoppingItem[];
    onToggleStatus: (id: string) => void;
    onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
    onDeleteItem: (id: string) => void;
}

export function ShoppingList({ items, onToggleStatus, onUpdateItem, onDeleteItem }: ShoppingListProps) {
    const groupedItems = useMemo(() => {
        const groups: Record<string, ShoppingItem[]> = {};

        items.forEach(item => {
            const cat = item.category || 'Outros';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(item);
        });

        return Object.keys(groups).sort().map(key => ({
            category: key,
            items: groups[key].sort((a, b) => {
                if (a.status === b.status) return a.name.localeCompare(b.name);
                return a.status === ItemStatus.COMPLETED ? 1 : -1;
            }),
            totalPrice: groups[key].reduce((sum, item) => sum + (item.price || 0), 0)
        }));
    }, [items]);

    if (items.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100 px-4">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">Sua lista está vazia</p>
                <p className="text-sm mt-1">Adicione itens manualmente ou use sugestões da IA!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groupedItems.map((group) => (
                <div key={group.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Cabeçalho da categoria */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                            {group.category}
                        </h3>
                        <div className="flex items-center gap-2">
                            {group.totalPrice > 0 && (
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    R${group.totalPrice.toFixed(2)}
                                </span>
                            )}
                            <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100">
                                {group.items.filter(i => i.status === ItemStatus.PENDING).length} itens
                            </span>
                        </div>
                    </div>

                    <ul className="divide-y divide-gray-50">
                        {group.items.map((item) => (
                            <li
                                key={item.id}
                                className={`flex items-center gap-3 px-4 py-3 transition-all ${item.status === ItemStatus.COMPLETED ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
                            >
                                {/* Botão de check */}
                                <button
                                    onClick={() => onToggleStatus(item.id)}
                                    className={`
                                        w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${item.status === ItemStatus.COMPLETED
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 text-transparent hover:border-green-500 active:border-green-500'}`}
                                    aria-label={item.status === ItemStatus.COMPLETED ? "Marcar como pendente" : "Marcar como comprado"}
                                >
                                    <Check size={13} strokeWidth={3} />
                                </button>

                                {/* Nome e quantidade */}
                                <div className={`flex flex-col flex-1 min-w-0 ${item.status === ItemStatus.COMPLETED ? 'opacity-40 line-through' : ''}`}>
                                    <span className="text-gray-800 font-medium text-sm truncate">{item.name}</span>
                                    {item.quantity && (
                                        <span className="text-xs text-gray-400 truncate">{item.quantity}</span>
                                    )}
                                </div>

                                {/* Input de preço */}
                                <div className="relative shrink-0 w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">R$</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={item.price === 0 ? '' : item.price}
                                        onChange={(e) => onUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                        placeholder="0,00"
                                        className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 bg-gray-50 border border-transparent hover:border-gray-400 focus:border-gray-400 focus:bg-white rounded-md text-right transition-all outline-none"
                                    />
                                </div>

                                {/* Botão deletar */}
                                <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="shrink-0 text-gray-500 hover:text-red-500 sm:group-hover:opacity-100 active:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 active:bg-red-50"
                                    aria-label="Remover item"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
