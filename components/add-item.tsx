"use client"

import { DEFAULT_CATEGORIES, ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface AddItemProps {
    onAddItem: (item: ShoppingItem) => void
}

export const addItemSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    category: z.string().min(1, 'Categoria é obrigatória'),
    price: z
        .string()
        .optional()
        .refine(
            (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
            { message: 'Preço inválido' }
        ),
})

export type AddItemSchema = z.infer<typeof addItemSchema>

export function AddItem({ onAddItem }: AddItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddItemSchema>({
        resolver: zodResolver(addItemSchema),
        defaultValues: {
            name: '',
            category: DEFAULT_CATEGORIES[0],
            price: '',
        },
    });

    const onSubmit = (data: AddItemSchema) => {
        const newItem: ShoppingItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            name: data.name.trim(),
            category: data.category,
            price: data.price ? parseFloat(data.price) : 0,
            status: ItemStatus.PENDING,
        };

        onAddItem(newItem);
        reset();
        setIsExpanded(false);
    };

    const handleClose = () => {
        reset();
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
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Novo item</span>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Nome */}
                        <div>
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="Nome do item (ex: Bananas)"
                                className={`w-full text-gray-700 px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                    }`}
                                autoFocus
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500 pl-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
                            {/* Categoria */}
                            <div className="col-span-2 sm:col-auto sm:flex-1">
                                <select
                                    {...register('category')}
                                    className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-600 text-sm transition-colors ${errors.category ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                        }`}
                                >
                                    {DEFAULT_CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="mt-1 text-xs text-red-500 pl-1">{errors.category.message}</p>
                                )}
                            </div>

                            {/* Preço */}
                            <div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">R$</span>
                                    <input
                                        {...register('price')}
                                        type="number"
                                        placeholder="0,00"
                                        min="0"
                                        step="0.01"
                                        className={`w-full pl-8 pr-3 py-2.5 text-gray-700 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                            }`}
                                    />
                                </div>
                                {errors.price && (
                                    <p className="mt-1 text-xs text-red-500 pl-1">{errors.price.message}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            Adicionar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
