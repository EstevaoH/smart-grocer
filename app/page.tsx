"use client"

import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { DEFAULT_PROFILE, UserProfile, loadProfile, saveProfile } from "@/types/user-profile";
import { ListSnapshot, createSnapshot, loadHistory, saveHistory } from "@/types/list-history";
import { useEffect, useRef, useState } from "react";
import { ShoppingBasket, AlertCircle, CheckCircle2, Share2, Trash2, Heart, BarChart2, ShoppingCart, Settings, Archive, Clock, Calculator } from "lucide-react";
import { AddItem } from "@/components/add-item";
import { RecipeGenerator } from "@/components/recipe-generator";
import { ShoppingList } from "@/components/shopping-list";
import { ConfirmModal } from "@/components/confirm-modal";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { SettingsModal } from "@/components/settings-modal";
import { ListHistory } from "@/components/list-history";
import { PriceCalculator } from "@/components/price-calculator";
import dynamic from "next/dynamic";

const BIDashboard = dynamic(
  () => import("@/components/bi-dashboard").then(m => m.BIDashboard),
  { ssr: false, loading: () => <div className="py-16 text-center text-gray-400 text-sm">Carregando painel...</div> }
);

const STORAGE_KEY = "smartgrocer_items_v1";

export default function Home() {

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"lista" | "bi" | "historico" | "calculadora">("lista");
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<ListSnapshot[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveLabel, setArchiveLabel] = useState("");
  const archiveLabelRef = useRef<HTMLInputElement>(null);

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
    setProfile(loadProfile());
    setHistory(loadHistory());
    setHasMounted(true);
  }, []);

  useEffect(() => { if (showArchiveModal) setTimeout(() => archiveLabelRef.current?.focus(), 50); }, [showArchiveModal]);

  const persistHistory = (h: ListSnapshot[]) => { setHistory(h); saveHistory(h); };

  const handleArchive = () => {
    if (items.length === 0) return;
    const snapshot = createSnapshot(items, archiveLabel);
    persistHistory([...history, snapshot]);
    setShowArchiveModal(false);
    setArchiveLabel("");
    showNotification(`"${snapshot.label}" arquivada!`);
  };

  const handleRestore = (snapshot: ListSnapshot) => {
    openConfirm({
      title: "Restaurar lista",
      message: `Deseja substituir a lista atual pelos ${snapshot.items.length} itens de "${snapshot.label}"?`,
      confirmLabel: "Restaurar",
      variant: "warning",
      onConfirm: () => {
        setItems(snapshot.items.map(i => ({ ...i })));
        setActiveTab("lista");
        closeConfirm();
        showNotification(`Lista "${snapshot.label}" restaurada!`);
      },
    });
  };

  const handleDeleteSnapshot = (id: string) => {
    openConfirm({
      title: "Excluir snapshot",
      message: "Tem certeza? Esta lista arquivada será excluída permanentemente.",
      confirmLabel: "Excluir",
      variant: "danger",
      onConfirm: () => {
        persistHistory(history.filter(h => h.id !== id));
        closeConfirm();
      },
    });
  };

  const handleRenameSnapshot = (id: string, newLabel: string) => {
    persistHistory(history.map(h => h.id === id ? { ...h, label: newLabel } : h));
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  const handleCompleteOnboarding = (partial: Partial<UserProfile>) => {
    const updated: UserProfile = { ...DEFAULT_PROFILE, ...partial, setupCompleted: true };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleClearData = () => {
    openConfirm({
      title: "Limpar todos os itens",
      message: "Tem certeza? Todos os itens da lista serão removidos permanentemente.",
      confirmLabel: "Limpar tudo",
      variant: "danger",
      onConfirm: () => {
        setItems([]);
        setShowSettings(false);
        closeConfirm();
      },
    });
  };

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
      const now = new Date().toISOString();
      const filteredNew = newItems
        .filter(i => !existingNames.has(i.name.toLowerCase()))
        .map(i => ({ ...i, createdAt: i.createdAt ?? now }));

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
    text += `💰 *Total: $${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`;

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
                {profile.setupCompleted && profile.name ? (
                  <p className="text-xs text-gray-500 font-medium">{profile.emoji} Olá, {profile.name}!</p>
                ) : (
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">Lista de compras inteligente</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {activeTab === "lista" && completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs font-medium cursor-pointer text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 px-2 sm:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  title="Limpar itens comprados"
                >
                  <span className="hidden sm:inline">Limpar comprados</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}
              {activeTab === "lista" && items.length > 0 && (
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="flex items-center gap-1 p-2 text-gray-500 cursor-pointer hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                  title="Arquivar lista atual"
                >
                  <Archive size={18} />
                </button>
              )}
              {activeTab === "lista" && (
                <button
                  onClick={handleShareList}
                  className="p-2 text-gray-500 cursor-pointer hover:text-primary hover:bg-emerald-50 rounded-full transition-colors"
                  aria-label="Compartilhar lista"
                  title="Compartilhar lista"
                >
                  <Share2 size={20} />
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-500 cursor-pointer hover:text-primary hover:bg-emerald-50 rounded-full transition-colors"
                aria-label="Configurações"
                title="Configurações"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("lista")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${activeTab === "lista"
                ? "border-primary text-primary bg-emerald-50/60"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <ShoppingCart size={15} />
              Lista
            </button>
            <button
              onClick={() => setActiveTab("bi")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${activeTab === "bi"
                ? "border-primary text-primary bg-emerald-50/60"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <BarChart2 size={15} />
              Painel BI
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${activeTab === "historico"
                ? "border-primary text-primary bg-emerald-50/60"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Clock size={15} />
              Histórico
              {history.length > 0 && (
                <span className="ml-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("calculadora")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${activeTab === "calculadora"
                ? "border-primary text-primary bg-emerald-50/60"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Calculator size={15} />
              Calculadora
            </button>
          </div>

          {activeTab === "lista" && totalCount > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>{completedCount} de {totalCount} itens comprados</span>
                <div className="text-right">
                  <span className="text-gray-400 mr-1">Total:</span>
                  <span className="font-bold text-gray-800 text-sm">R${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {completedPrice > 0 && (
                    <span className="text-emerald-600 ml-2">· Gasto: R${completedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

        {activeTab === "lista" && (
          <>
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
          </>
        )}

        {activeTab === "bi" && (
          <>
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Painel BI</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs text-gray-400 font-medium">
                {items.length} produto{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <BIDashboard items={items} />
          </>
        )}

        {activeTab === "calculadora" && (
          <>
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Calculadora de Preço</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            <PriceCalculator />
          </>
        )}

        {activeTab === "historico" && (
          <>
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Histórico de Listas</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs text-gray-400 font-medium">{history.length} salva{history.length !== 1 ? "s" : ""}</span>
            </div>
            <ListHistory
              history={history}
              onRestore={handleRestore}
              onDelete={handleDeleteSnapshot}
              onRename={handleRenameSnapshot}
            />
          </>
        )}

      </main>
      <footer className="text-center text-gray-500 text-sm mt-8 mb-6">
        <p className="flex items-center justify-center gap-1">Feito com <Heart className="text-green-500" size={13} fill="currentColor" /> por <a href="https://github.com/estevaoh" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Estevão</a></p>
      </footer>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
      {/* Onboarding wizard — shown only on first launch */}
      {hasMounted && !profile.setupCompleted && (
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
      )}
      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowSettings(false)}
          onClearData={handleClearData}
        />
      )}
      {/* Archive modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowArchiveModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl"><Archive className="text-amber-600" size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Arquivar lista atual</h2>
                <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""} serão salvos</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da lista <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                ref={archiveLabelRef}
                type="text"
                placeholder={`Lista de ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}`}
                value={archiveLabel}
                onChange={e => setArchiveLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleArchive()}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 outline-none text-sm text-gray-800 transition-all"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowArchiveModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleArchive} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors">Arquivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
