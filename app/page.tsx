"use client"

import { useState } from "react";
import { ShoppingBasket, CheckCircle2, Share2, Archive, ShoppingCart, BarChart2, Clock, Calculator, Settings, Trash2, Heart } from "lucide-react";
import dynamic from "next/dynamic";

// Features
import { useShoppingList, ShoppingList, AddItem, RecipeGenerator } from "@/features/shopping-list";
import { useListHistory, ListHistory } from "@/features/list-history";
import { PriceCalculator } from "@/features/price-calculator";

// Shared
import { useNotification } from "@/shared/hooks/useNotification";
import { useConfirmModal } from "@/shared/hooks/useConfirmModal";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { OnboardingWizard } from "@/shared/components/onboarding-wizard";
import { SettingsModal } from "@/shared/components/settings-modal";

// Types
import { DEFAULT_PROFILE, UserProfile, loadProfile, saveProfile } from "@/types/user-profile";

const BIDashboard = dynamic(
  () => import("@/features/bi-dashboard").then((m) => m.BIDashboard),
  { ssr: false, loading: () => <div className="py-16 text-center text-gray-400 text-sm">Carregando painel...</div> }
);

type Tab = "lista" | "bi" | "historico" | "calculadora";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("lista");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [showSettings, setShowSettings] = useState(false);

  const { notification, showNotification } = useNotification();
  const { confirmModal, openConfirm, closeConfirm } = useConfirmModal();

  const list = useShoppingList();

  const history = useListHistory(
    list.items,
    showNotification,
    openConfirm,
    closeConfirm,
    (restoredItems) => {
      list.handleRestoreItems(restoredItems);
      setActiveTab("lista");
    }
  );

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
        list.handleClearAll();
        setShowSettings(false);
        closeConfirm();
      },
    });
  };

  const handleClearCompleted = () => {
    openConfirm({
      title: "Limpar comprados",
      message: "Remover todos os itens já marcados como comprados?",
      confirmLabel: "Limpar comprados",
      variant: "warning",
      onConfirm: () => { list.handleClearCompleted(); closeConfirm(); },
    });
  };

  const handleClearAll = () => {
    openConfirm({
      title: "Limpar toda a lista",
      message: "Todos os itens da lista serão removidos permanentemente. Tem certeza?",
      confirmLabel: "Limpar tudo",
      variant: "danger",
      onConfirm: () => { list.handleClearAll(); closeConfirm(); },
    });
  };

  const handleShareList = async () => {
    const msg = await list.handleShareList();
    if (msg) showNotification(msg);
  };

  const handleAddMultipleItems = (items: Parameters<typeof list.handleAddMultipleItems>[0]) => {
    list.handleAddMultipleItems(items);
    const count = items.length;
    if (count > 0) showNotification(`${count} item${count !== 1 ? "s" : ""} adicionado${count !== 1 ? "s" : ""}!`);
  };

  const TABS = [
    { id: "lista" as Tab, label: "Lista", icon: <ShoppingCart size={15} /> },
    { id: "bi" as Tab, label: "Painel BI", icon: <BarChart2 size={15} /> },
    { id: "historico" as Tab, label: "Histórico", icon: <Clock size={15} />, badge: history.history.length },
    { id: "calculadora" as Tab, label: "Calculadora", icon: <Calculator size={15} /> },
  ];

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
              {activeTab === "lista" && list.completedCount > 0 && (
                <button onClick={handleClearCompleted} className="text-xs font-medium cursor-pointer text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 px-2 sm:px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">Limpar comprados</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}
              {activeTab === "lista" && list.items.length > 0 && (
                <button onClick={history.openArchiveModal} className="flex items-center gap-1 p-2 text-gray-500 cursor-pointer hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors" title="Arquivar lista atual">
                  <Archive size={18} />
                </button>
              )}
              {activeTab === "lista" && (
                <button onClick={handleShareList} className="p-2 text-gray-500 cursor-pointer hover:text-primary hover:bg-emerald-50 rounded-full transition-colors" aria-label="Compartilhar lista">
                  <Share2 size={20} />
                </button>
              )}
              <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 cursor-pointer hover:text-primary hover:bg-emerald-50 rounded-full transition-colors" aria-label="Configurações">
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary bg-emerald-50/60" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge ? <span className="ml-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span> : null}
              </button>
            ))}
          </div>

          {activeTab === "lista" && list.totalCount > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>{list.completedCount} de {list.totalCount} itens comprados</span>
                <div className="text-right">
                  <span className="text-gray-400 mr-1">Total:</span>
                  <span className="font-bold text-gray-800 text-sm">R${list.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {list.completedPrice > 0 && (
                    <span className="text-emerald-600 ml-2">· Gasto: R${list.completedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${list.progress}%` }} />
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
            <AddItem onAddItem={list.handleAddItem} />
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Lista de compras</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
              {list.items.length > 0 && (
                <button onClick={handleClearAll} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Limpar tudo</span>
                </button>
              )}
            </div>
            <ShoppingList items={list.items} onToggleStatus={list.handleToggleStatus} onUpdateItem={list.handleUpdateItem} onDeleteItem={list.handleDeleteItem} />
          </>
        )}

        {activeTab === "bi" && (
          <>
            <div className="mb-5 flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Painel BI</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs text-gray-400 font-medium">{list.items.length} produto{list.items.length !== 1 ? "s" : ""}</span>
            </div>
            <BIDashboard items={list.items} />
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
              <span className="text-xs text-gray-400 font-medium">{history.history.length} salva{history.history.length !== 1 ? "s" : ""}</span>
            </div>
            <ListHistory history={history.history} onRestore={history.handleRestore} onDelete={history.handleDeleteSnapshot} onRename={history.handleRenameSnapshot} />
          </>
        )}

      </main>

      <footer className="text-center text-gray-500 text-sm mt-8 mb-6">
        <p className="flex items-center justify-center gap-1">Feito com <Heart className="text-green-500" size={13} fill="currentColor" /> por <a href="https://github.com/estevaoh" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Estevão</a></p>
      </footer>

      <ConfirmModal {...confirmModal} onCancel={closeConfirm} />

      {list.hasMounted && !profile.setupCompleted && (
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
      )}

      {showSettings && (
        <SettingsModal profile={profile} onSave={handleSaveProfile} onClose={() => setShowSettings(false)} onClearData={handleClearData} />
      )}

      {/* Archive modal */}
      {history.showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) history.setShowArchiveModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl"><Archive className="text-amber-600" size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Arquivar lista atual</h2>
                <p className="text-xs text-gray-400">{list.items.length} item{list.items.length !== 1 ? "s" : ""} serão salvos</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome da lista <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                ref={history.archiveLabelRef}
                type="text"
                placeholder={`Lista de ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}`}
                value={history.archiveLabel}
                onChange={e => history.setArchiveLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && history.handleArchive()}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary/30 outline-none text-sm text-gray-800 transition-all"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => history.setShowArchiveModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={history.handleArchive} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors">Arquivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
