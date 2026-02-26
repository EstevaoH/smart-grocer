"use client"

import { generateIngredientsFromRecipe, parseSmartList } from "@/service/geminiService";
import { ShoppingItem } from "@/types/shopping-item";
import { ChefHat, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { AlertModal } from "@/shared/components/alert-modal";

interface RecipeGeneratorProps {
    onAddItems: (items: ShoppingItem[]) => void;
}

export function RecipeGenerator({ onAddItems }: RecipeGeneratorProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'recipe' | 'smart'>('recipe');
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        try {
            let items: ShoppingItem[] = [];
            if (activeTab === 'recipe') {
                items = await generateIngredientsFromRecipe(input);
            } else {
                items = await parseSmartList(input);
            }
            onAddItems(items);
            setInput('');
        } catch (error) {
            console.error("Failed to generate items", error);
            setErrorModal({ isOpen: true, message: "Algo deu errado com a IA. Tente novamente." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={errorModal.isOpen}
                title="Erro na IA"
                message={errorModal.message}
                variant="error"
                onClose={() => setErrorModal({ isOpen: false, message: '' })}
            />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-gray-50 rounded-xl p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('recipe')}
                        className={`flex flex-1 items-center text-zinc-700 justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'recipe'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <ChefHat size={16} className="shrink-0" />
                        <span className="truncate">Receita para lista</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('smart')}
                        className={`flex flex-1 items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'smart'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Wand2 size={16} className="shrink-0" />
                        <span className="truncate">Análise de texto</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            activeTab === 'recipe'
                                ? "O que você quer cozinhar? (ex: 'Spaghetti Carbonara para 4')"
                                : "Coloque uma lista ou descreva o que precisa (ex: 'Preciso de leite, ovos e coisas para uma salada')"
                        }
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 focus:bg-white focus:ring-0 transition-all resize-none h-24 text-gray-700 placeholder-gray-400 text-sm outline-none"
                        disabled={isLoading}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-400 leading-snug">
                            {activeTab === 'recipe'
                                ? "Powered by Gemini. Sugere ingredientes e categoriza automaticamente."
                                : "Coloque texto desorganizado e deixe o Gemini organizar para você."}
                        </p>

                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`
                            shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                            ${isLoading || !input.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary to-green-400 cursor-pointer text-gray-900 font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Pensando...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={15} />
                                    <span>Gerar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
