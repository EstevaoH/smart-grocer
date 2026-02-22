"use client"

import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingBasket, AlertCircle, CheckCircle2, Share2, Trash2 } from "lucide-react";
import { AddItem } from "@/components/add-item";
import { RecipeGenerator } from "@/components/recipe-generator";
import { ShoppingList } from "@/components/shopping-list";
import { ConfirmModal } from "@/components/confirm-modal";

const STORAGE_KEY = "smartgrocer_items_v1";

export default function Home() {

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  const [notification, setNotification] = useState<{ show: boolean, message: string }>({
    show: false,
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const openConfirm = (config: Omit<typeof confirmModal, 'isOpen'>) => {
    setConfirmModal({ isOpen: true, ...config });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Load from localStorage only on the client (after hydration)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load items", e);
    }
    setHasMounted(true);
  }, []);

  // Persist to localStorage whenever items change (only after mount)
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hasMounted]);

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  const handleAddItem = (newItem: ShoppingItem) => {
    setItems(prev => [...prev, newItem]);
  };


  const handleAddMultipleItems = (newItems: ShoppingItem[]) => {
    // Prevent duplicates based on name (simple normalization)
    setItems(prev => {
      const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
      const filteredNew = newItems.filter(i => !existingNames.has(i.name.toLowerCase()));

      if (filteredNew.length > 0) {
        showNotification(`${filteredNew.length} item adicionado com sucesso!`);
      }

      return [...prev, ...filteredNew];
    });
  };

  const handleToggleStatus = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: item.status === ItemStatus.PENDING ? ItemStatus.COMPLETED : ItemStatus.PENDING }
        : item
    ));
  };

  const handleUpdateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };


  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCompleted = () => {
    openConfirm({
      title: "Limpar comprados",
      message: "Remover todos os itens já marcados como comprados? Essa ação não pode ser desfeita.",
      confirmLabel: "Limpar comprados",
      variant: "warning",
      onConfirm: () => {
        setItems(prev => prev.filter(item => item.status !== ItemStatus.COMPLETED));
        closeConfirm();
      },
    });
  };

  const handleClearAll = () => {
    openConfirm({
      title: "Limpar toda a lista",
      message: "Todos os itens da lista serão removidos permanentemente. Tem certeza?",
      confirmLabel: "Limpar tudo",
      variant: "danger",
      onConfirm: () => {
        setItems([]);
        closeConfirm();
      },
    });
  };

  const handleShareList = async () => {
    if (items.length === 0) {
      showNotification("Lista vazia!");
      return;
    }

    const groups: Record<string, ShoppingItem[]> = {};
    items.forEach(item => {
      const cat = item.category || 'Outro';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    let text = "🛒 *SmartGrocer List*\n\n";

    Object.keys(groups).sort().forEach(cat => {
      const catItems = groups[cat];
      if (catItems.length === 0) return;
      text += `*${cat}*\n`;
      catItems.forEach(item => {
        const status = item.status === ItemStatus.COMPLETED ? "✅" : "⬜";
        const qty = item.quantity ? ` (${item.quantity})` : "";
        const price = item.price ? ` - $${item.price.toFixed(2)}` : "";
        text += `${status} ${item.name}${qty}${price}\n`;
      });
      text += "\n";
    });

    const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
    text += `💰 *Total: $${total.toFixed(2)}*`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de compras',
          text: text,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showNotification("Lista copiada para a área de transferência!");
      } catch (err) {
        console.error('Failed to copy', err);
        showNotification("Falha ao copiar lista.");
      }
    }
  };

  const completedCount = items.filter(i => i.status === ItemStatus.COMPLETED).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const completedPrice = items
    .filter(i => i.status === ItemStatus.COMPLETED)
    .reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen pb-24 bg-[#f3f4f6]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-primary to-emerald-300 p-2.5 rounded-xl shadow-lg shadow-emerald-200">
                <ShoppingBasket className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">SmartGrocer</h1>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">Lista de compras inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs font-medium cursor-pointer text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 px-2 sm:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  title="Limpar itens comprados"
                >
                  <span className="hidden sm:inline">Limpar comprados</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}
              <button
                onClick={handleShareList}
                className="p-2 text-gray-500 cursor-pointer hover:text-primary hover:bg-emerald-50 rounded-full transition-colors"
                aria-label="Compartilhar lista"
                title="Compartilhar lista"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
          {totalCount > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>{completedCount} de {totalCount} itens comprados</span>
                <div className="text-right">
                  <span className="text-gray-400 mr-1">Total:</span>
                  <span className="font-bold text-gray-800 text-sm">R${totalPrice.toFixed(2)}</span>
                  {completedPrice > 0 && (
                    <span className="text-emerald-600 ml-2">· Gasto: R${completedPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 pt-5">

        {notification.show && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-max max-w-[calc(100vw-2rem)] bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium text-center">{notification.message}</span>
          </div>
        )}

        <RecipeGenerator onAddItems={handleAddMultipleItems} />

        <AddItem onAddItem={handleAddItem} />

        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">Lista de compras</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Limpar toda a lista"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Limpar tudo</span>
            </button>
          )}
        </div>

        <ShoppingList
          items={items}
          onToggleStatus={handleToggleStatus}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
        />

        {process.env.API_KEY && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> API Key is missing. The AI features (Magic Add) will not work until a valid Gemini API key is provided in the environment.
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
