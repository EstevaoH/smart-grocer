"use client"

import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
    TrendingUp, TrendingDown, ShoppingCart, CheckCircle2, DollarSign,
    Package, ChevronDown, ChevronUp, BarChart2, PieChart, TableProperties,
    CalendarDays, Minus, Download, Target, Pencil, Check, X,
    AlertTriangle, Trophy,
} from "lucide-react";
import { CATEGORY_COLORS, MONTH_NAMES, STORAGE_BUDGET } from "@/constants";
import { fmt, toDateStr, itemMonthKey, itemDayKey, monthLabel } from "@/utils/formatter-date";
import { exportCSV } from "@/utils/export-csv";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler);

interface BIDashboardProps { items: ShoppingItem[] }

type SortKey = "name" | "category" | "quantity" | "price" | "status";
type SortDir = "asc" | "desc";
type ActiveView = "charts" | "table" | "mensal" | "categoria" | "mapa";




export function BIDashboard({ items }: BIDashboardProps) {
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [activeView, setActiveView] = useState<ActiveView>("charts");

    // F1 – date filter
    // default: last 90 days
    const defaultEnd = toDateStr(new Date());
    const defaultStart = toDateStr(new Date(Date.now() - 90 * 86400000));
    const [dateFrom, setDateFrom] = useState(defaultStart);
    const [dateTo, setDateTo] = useState(defaultEnd);
    const [filterActive, setFilterActive] = useState(false);

    // F3 – budget goal
    const [budget, setBudget] = useState<number>(0);
    const [budgetEdit, setBudgetEdit] = useState(false);
    const [budgetInput, setBudgetInput] = useState("");
    const budgetRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_BUDGET);
        if (saved) setBudget(parseFloat(saved) || 0);
    }, []);

    useEffect(() => { if (budgetEdit) budgetRef.current?.focus(); }, [budgetEdit]);

    const saveBudget = () => {
        const v = parseFloat(budgetInput) || 0;
        setBudget(v);
        localStorage.setItem(STORAGE_BUDGET, String(v));
        setBudgetEdit(false);
    };

    // F2 – category selector
    const [selectedCat, setSelectedCat] = useState<string>("");

    // filtered items
    const filtered = useMemo(() => {
        if (!filterActive) return items;
        const from = new Date(dateFrom + "T00:00:00");
        const to = new Date(dateTo + "T23:59:59");
        return items.filter(i => {
            const d = i.createdAt ? new Date(i.createdAt) : new Date();
            return d >= from && d <= to;
        });
    }, [items, filterActive, dateFrom, dateTo]);

    const metrics = useMemo(() => {
        const totalItems = filtered.length;
        const completedItems = filtered.filter(i => i.status === ItemStatus.COMPLETED).length;
        const totalSpent = filtered.filter(i => i.status === ItemStatus.COMPLETED).reduce((s, i) => s + (i.price || 0), 0);
        const totalPlanned = filtered.reduce((s, i) => s + (i.price || 0), 0);
        return { totalItems, completedItems, pendingItems: totalItems - completedItems, totalSpent, totalPlanned, avgPrice: totalItems > 0 ? totalPlanned / totalItems : 0 };
    }, [filtered]);

    const categoryStats = useMemo(() => {
        const map: Record<string, { count: number; spent: number; planned: number }> = {};
        filtered.forEach(item => {
            const cat = item.category || "Outros";
            if (!map[cat]) map[cat] = { count: 0, spent: 0, planned: 0 };
            map[cat].count++;
            map[cat].planned += item.price || 0;
            if (item.status === ItemStatus.COMPLETED) map[cat].spent += item.price || 0;
        });
        return Object.entries(map).sort((a, b) => b[1].planned - a[1].planned)
            .map(([cat, d], i) => ({ cat, ...d, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
    }, [filtered]);

    const monthlyStats = useMemo(() => {
        const map: Record<string, { planned: number; spent: number; count: number; completedCount: number }> = {};
        filtered.forEach(item => {
            const key = itemMonthKey(item);
            if (!map[key]) map[key] = { planned: 0, spent: 0, count: 0, completedCount: 0 };
            map[key].planned += item.price || 0;
            map[key].count++;
            if (item.status === ItemStatus.COMPLETED) { map[key].spent += item.price || 0; map[key].completedCount++; }
        });
        const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
        return sorted.map(([key, d], idx) => {
            const prev = idx > 0 ? sorted[idx - 1][1] : null;
            return { key, label: monthLabel(key), ...d, deltaSpent: prev ? d.spent - prev.spent : null, deltaPlanned: prev ? d.planned - prev.planned : null };
        });
    }, [filtered]);

    // F2 – category monthly
    const allCategories = useMemo(() => [...new Set(items.map(i => i.category || "Outros"))].sort(), [items]);
    useEffect(() => { if (!selectedCat && allCategories.length > 0) setSelectedCat(allCategories[0]); }, [allCategories, selectedCat]);

    const catMonthlyData = useMemo(() => {
        if (!selectedCat) return null;
        const map: Record<string, { planned: number; spent: number }> = {};
        items.filter(i => (i.category || "Outros") === selectedCat).forEach(item => {
            const key = itemMonthKey(item);
            if (!map[key]) map[key] = { planned: 0, spent: 0 };
            map[key].planned += item.price || 0;
            if (item.status === ItemStatus.COMPLETED) map[key].spent += item.price || 0;
        });
        const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
        return {
            labels: sorted.map(([k]) => monthLabel(k)),
            datasets: [
                { label: "Planejado (R$)", data: sorted.map(([, d]) => d.planned), backgroundColor: "#818cf8cc", borderColor: "#6366f1", borderWidth: 1.5, borderRadius: 6 },
                { label: "Gasto (R$)", data: sorted.map(([, d]) => d.spent), backgroundColor: "#34d399cc", borderColor: "#10b981", borderWidth: 1.5, borderRadius: 6 },
            ],
        };
    }, [items, selectedCat]);

    // F4 – top 5 expensive
    const top5 = useMemo(() => [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5), [filtered]);

    // F6 – heatmap
    const heatmapData = useMemo(() => {
        const map: Record<string, number> = {};
        filtered.forEach(i => { const k = itemDayKey(i); map[k] = (map[k] || 0) + 1; });
        return map;
    }, [filtered]);

    const heatmapDays = useMemo(() => {
        const days: { date: string; count: number }[] = [];
        const endD = filterActive ? new Date(dateTo + "T23:59:59") : new Date();
        const startD = filterActive ? new Date(dateFrom + "T00:00:00") : new Date(endD.getTime() - 90 * 86400000);
        const cur = new Date(startD);
        while (cur <= endD) {
            const k = toDateStr(cur);
            days.push({ date: k, count: heatmapData[k] || 0 });
            cur.setDate(cur.getDate() + 1);
        }
        return days;
    }, [heatmapData, filterActive, dateFrom, dateTo]);

    const maxHeat = useMemo(() => Math.max(1, ...heatmapDays.map(d => d.count)), [heatmapDays]);

    function heatColor(count: number) {
        if (count === 0) return "#f3f4f6";
        const intensity = Math.min(count / maxHeat, 1);
        if (intensity < 0.25) return "#d1fae5";
        if (intensity < 0.5) return "#6ee7b7";
        if (intensity < 0.75) return "#10b981";
        return "#065f46";
    }

    // Sorted table
    const sortedItems = useMemo(() => [...filtered].sort((a, b) => {
        let va: string | number = "", vb: string | number = "";
        if (sortKey === "name") { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
        if (sortKey === "category") { va = (a.category || "").toLowerCase(); vb = (b.category || "").toLowerCase(); }
        if (sortKey === "quantity") { va = a.quantity || ""; vb = b.quantity || ""; }
        if (sortKey === "price") { va = a.price || 0; vb = b.price || 0; }
        if (sortKey === "status") { va = a.status; vb = b.status; }
        return va < vb ? (sortDir === "asc" ? -1 : 1) : va > vb ? (sortDir === "asc" ? 1 : -1) : 0;
    }), [filtered, sortKey, sortDir]);

    const handleSort = (k: SortKey) => { if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("asc"); } };

    // Chart options helpers
    const barOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" as const, labels: { font: { size: 12 }, color: "#6b7280" } }, tooltip: { callbacks: { label: (c: { dataset: { label?: string }; raw: unknown }) => ` ${c.dataset.label}: R$ ${fmt(Number(c.raw))}` } } }, scales: { x: { ticks: { color: "#9ca3af", font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: "#9ca3af", font: { size: 11 }, callback: (v: number | string) => `R$ ${Number(v).toFixed(0)}` }, grid: { color: "#f3f4f6" } } } };
    const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" as const, labels: { font: { size: 12 }, color: "#6b7280", padding: 14 } }, tooltip: { callbacks: { label: (c: { label?: string; raw: unknown; chart: { data: { datasets: Array<{ data: unknown[] }> } } }) => { const total = (c.chart.data.datasets[0].data as number[]).reduce((s, v) => s + Number(v), 0); return ` ${c.label}: R$ ${fmt(Number(c.raw))} (${total > 0 ? ((Number(c.raw) / total) * 100).toFixed(1) : 0}%)`; } } } } };
    const lineOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { raw: unknown }) => ` R$ ${fmt(Number(c.raw))}` } } }, scales: { x: { ticks: { color: "#9ca3af", font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: "#9ca3af", font: { size: 11 }, callback: (v: number | string) => `R$ ${Number(v).toFixed(0)}` }, grid: { color: "#f3f4f6" } } } };

    const barData = { labels: categoryStats.map(c => c.cat), datasets: [{ label: "Planejado (R$)", data: categoryStats.map(c => c.planned), backgroundColor: categoryStats.map(c => c.color + "cc"), borderColor: categoryStats.map(c => c.color), borderWidth: 1.5, borderRadius: 6 }, { label: "Gasto (R$)", data: categoryStats.map(c => c.spent), backgroundColor: categoryStats.map(c => c.color + "55"), borderColor: categoryStats.map(c => c.color), borderWidth: 1.5, borderRadius: 6 }] };
    const pieData = { labels: categoryStats.map(c => c.cat), datasets: [{ data: categoryStats.map(c => c.planned), backgroundColor: categoryStats.map(c => c.color + "cc"), borderColor: categoryStats.map(c => c.color), borderWidth: 2, hoverOffset: 8 }] };

    const lineData = useMemo(() => {
        const done = filtered.filter(i => i.status === ItemStatus.COMPLETED && (i.price || 0) > 0);
        let acc = 0;
        const pts = done.map((item, idx) => { acc += item.price || 0; return { label: `Item ${idx + 1}`, value: acc }; });
        return { labels: pts.map(p => p.label), datasets: [{ label: "Gasto acumulado", data: pts.map(p => p.value), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.12)", borderWidth: 2.5, pointBackgroundColor: "#10b981", pointRadius: 4, tension: 0.35, fill: true }] };
    }, [filtered]);

    const monthlyBarData = { labels: monthlyStats.map(m => m.label), datasets: [{ label: "Planejado (R$)", data: monthlyStats.map(m => m.planned), backgroundColor: "#818cf8cc", borderColor: "#6366f1", borderWidth: 1.5, borderRadius: 6 }, { label: "Gasto (R$)", data: monthlyStats.map(m => m.spent), backgroundColor: "#34d399cc", borderColor: "#10b981", borderWidth: 1.5, borderRadius: 6 }] };

    const budgetPct = budget > 0 ? Math.min((metrics.totalSpent / budget) * 100, 100) : 0;
    const budgetOver = budget > 0 && metrics.totalSpent >= budget;
    const budgetWarn = budget > 0 && metrics.totalSpent >= budget * 0.8 && !budgetOver;

    const SortIcon = ({ col }: { col: SortKey }) => sortKey !== col ? <ChevronDown size={13} className="text-gray-300 ml-0.5" /> : sortDir === "asc" ? <ChevronUp size={13} className="text-primary ml-0.5" /> : <ChevronDown size={13} className="text-primary ml-0.5" />;
    const DeltaBadge = ({ value }: { value: number | null }) => {
        if (value === null) return <span className="text-gray-300 text-xs">—</span>;
        if (Math.abs(value) < 0.01) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus size={11} />igual</span>;
        const up = value > 0;
        return <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-red-500" : "text-emerald-600"}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? "+" : ""}R$ {fmt(Math.abs(value))}</span>;
    };

    const emptyState = items.length === 0;

    return (
        <div className="space-y-5">

            {/* ── F1 DATE FILTER ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <label className="text-xs font-medium text-gray-500">De</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <label className="text-xs font-medium text-gray-500">Até</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-primary" />
                    </div>
                    <button
                        onClick={() => setFilterActive(f => !f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterActive ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {filterActive ? "Filtro ativo" : "Filtrar"}
                    </button>
                    {filterActive && (
                        <button onClick={() => setFilterActive(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><X size={16} /></button>
                    )}
                    {/* F5 CSV Export */}
                    <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-primary transition-all">
                        <Download size={15} />CSV
                    </button>
                </div>
                {filterActive && (
                    <p className="text-xs text-primary mt-2 font-medium">
                        Mostrando {filtered.length} de {items.length} itens
                    </p>
                )}
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={<ShoppingCart size={18} className="text-blue-500" />} label="Total de itens" value={metrics.totalItems.toString()} bg="bg-blue-50" />
                <StatCard icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="Comprados" value={`${metrics.completedItems} / ${metrics.totalItems}`} bg="bg-emerald-50" />
                <StatCard icon={<Package size={18} className="text-amber-500" />} label="Pendentes" value={metrics.pendingItems.toString()} bg="bg-amber-50" />
                <StatCard icon={<DollarSign size={18} className="text-green-600" />} label="Total gasto" value={`R$ ${fmt(metrics.totalSpent)}`} bg="bg-green-50" />
                <StatCard icon={<TrendingUp size={18} className="text-violet-500" />} label="Total planejado" value={`R$ ${fmt(metrics.totalPlanned)}`} bg="bg-violet-50" />
                <StatCard icon={<BarChart2 size={18} className="text-rose-500" />} label="Preço médio" value={`R$ ${fmt(metrics.avgPrice)}`} bg="bg-rose-50" />
            </div>

            {/* ── F3 BUDGET GOAL ── */}
            <div className={`rounded-2xl border shadow-sm p-4 ${budgetOver ? "bg-red-50 border-red-200" : budgetWarn ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100"}`}>
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${budgetOver ? "bg-red-100" : budgetWarn ? "bg-yellow-100" : "bg-emerald-50"}`}>
                            {budgetOver ? <AlertTriangle size={16} className="text-red-500" /> : <Target size={16} className="text-primary" />}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Meta de orçamento mensal</span>
                        {budgetOver && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Ultrapassado!</span>}
                        {budgetWarn && <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Atenção: 80%+</span>}
                    </div>
                    {!budgetEdit ? (
                        <button onClick={() => { setBudgetInput(budget > 0 ? budget.toFixed(2) : ""); setBudgetEdit(true); }} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-emerald-50 transition-colors">
                            <Pencil size={14} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">R$</span>
                            <input ref={budgetRef} type="number" min="0" step="0.01" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setBudgetEdit(false); }} className="w-28 px-2 py-1 text-sm text-gray-700 border border-primary rounded-lg outline-none" />
                            <button onClick={saveBudget} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                            <button onClick={() => setBudgetEdit(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                        </div>
                    )}
                </div>
                {budget > 0 ? (
                    <>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Gasto: <span className="font-semibold text-gray-800">R$ {fmt(metrics.totalSpent)}</span></span>
                            <span>Meta: <span className="font-semibold text-gray-800">R$ {fmt(budget)}</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${budgetOver ? "bg-red-500" : budgetWarn ? "bg-yellow-400" : "bg-primary"}`} style={{ width: `${budgetPct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{budgetPct.toFixed(1)}% utilizado</p>
                    </>
                ) : (
                    <p className="text-xs text-gray-400">Clique no lápis para definir um orçamento mensal.</p>
                )}
            </div>

            {/* ── VIEW TOGGLE ── */}
            <div className="flex gap-2 flex-wrap">
                <TabBtn active={activeView === "charts"} onClick={() => setActiveView("charts")} icon={<PieChart size={15} />}>Gráficos</TabBtn>
                <TabBtn active={activeView === "table"} onClick={() => setActiveView("table")} icon={<TableProperties size={15} />}>Tabela</TabBtn>
                <TabBtn active={activeView === "mensal"} onClick={() => setActiveView("mensal")} icon={<CalendarDays size={15} />}>Mensal</TabBtn>
                <TabBtn active={activeView === "categoria"} onClick={() => setActiveView("categoria")} icon={<TrendingUp size={15} />}>Categoria</TabBtn>
                <TabBtn active={activeView === "mapa"} onClick={() => setActiveView("mapa")} icon={<BarChart2 size={15} />}>Mapa</TabBtn>
            </div>

            {emptyState && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                    <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">Nenhum dado disponível</p>
                    <p className="text-sm mt-1">Adicione produtos à lista para visualizar o painel.</p>
                </div>
            )}

            {/* ── GRÁFICOS ── */}
            {!emptyState && activeView === "charts" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Gasto por Categoria</h3>
                        <div className="h-64"><Bar data={barData} options={barOpts} /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribuição por Categoria</h3>
                            <div className="h-56"><Pie data={pieData} options={pieOpts} /></div>
                        </div>
                        {/* F4 Top 5 */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Trophy size={15} className="text-amber-400" />Top 5 mais caros</h3>
                            {top5.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Nenhum item com preço</p>
                            ) : (
                                <div className="space-y-2">
                                    {top5.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <span className={`w-5 h-5 shrink-0 rounded-full text-xs font-bold flex items-center justify-center text-white ${["bg-amber-400", "bg-gray-400", "bg-orange-500", "bg-gray-300", "bg-gray-300"][idx]}`}>{idx + 1}</span>
                                            <span className="flex-1 text-xs text-gray-700 truncate font-medium">{item.name}</span>
                                            <span className="text-xs text-gray-400 truncate max-w-[70px]">{item.category || "Outros"}</span>
                                            <span className="text-xs font-bold text-gray-800 shrink-0">R$ {fmt(item.price || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Curva de Gasto Acumulado</h3>
                        <p className="text-xs text-gray-400 mb-3">Itens comprados em ordem de marcação</p>
                        {lineData.labels.length === 0 ? <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Marque itens como comprados para ver a curva</div> : <div className="h-48"><Line data={lineData} options={lineOpts} /></div>}
                    </div>
                </div>
            )}

            {/* ── TABELA ── */}
            {!emptyState && activeView === "table" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {([["name", "Produto"], ["category", "Categoria"], ["quantity", "Quantidade"], ["price", "Preço (R$)"], ["status", "Status"]] as [SortKey, string][]).map(([k, l]) => (
                                        <th key={k} onClick={() => handleSort(k)} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-primary transition-colors whitespace-nowrap">
                                            <span className="flex items-center gap-0.5">{l}<SortIcon col={k} /></span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sortedItems.map(item => (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === ItemStatus.COMPLETED ? "opacity-60" : ""}`}>
                                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[140px] truncate">{item.name}</td>
                                        <td className="px-4 py-3 text-gray-500"><span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[categoryStats.findIndex(c => c.cat === (item.category || "Outros")) % CATEGORY_COLORS.length] || "#10b981" }} />{item.category || "Outros"}</span></td>
                                        <td className="px-4 py-3 text-gray-500">{item.quantity || "—"}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-800">{item.price ? `R$ ${fmt(item.price)}` : "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${item.status === ItemStatus.COMPLETED ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === ItemStatus.COMPLETED ? "bg-emerald-500" : "bg-amber-400"}`} />
                                                {item.status === ItemStatus.COMPLETED ? "Comprado" : "Pendente"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 border-t border-gray-200">
                                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-500">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-800">R$ {fmt(metrics.totalPlanned)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">Gasto: <span className="font-semibold text-emerald-600">R$ {fmt(metrics.totalSpent)}</span></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── MENSAL ── */}
            {!emptyState && activeView === "mensal" && (
                <div className="space-y-4">
                    {monthlyStats.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Sem dados mensais</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Planejado vs Gasto por Mês</h3>
                                <div className="h-64"><Bar data={monthlyBarData} options={barOpts} /></div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                    <CalendarDays size={15} className="text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-700">Tabela Comparativa Mensal</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                {["Mês", "Planejado", "Var.", "Gasto", "Var.", "Itens", "% Comprado"].map(h => (
                                                    <th key={h} className="px-4 py-3 text-right first:text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {monthlyStats.map((m, idx) => {
                                                const pct = m.count > 0 ? (m.completedCount / m.count) * 100 : 0;
                                                const isLast = idx === monthlyStats.length - 1;
                                                return (
                                                    <tr key={m.key} className={`hover:bg-gray-50 transition-colors ${isLast ? "bg-emerald-50/40" : ""}`}>
                                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                            <span className="flex items-center gap-1.5">{isLast && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}{m.label}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-800 tabular-nums">R$ {fmt(m.planned)}</td>
                                                        <td className="px-4 py-3 text-right"><DeltaBadge value={m.deltaPlanned} /></td>
                                                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold tabular-nums">R$ {fmt(m.spent)}</td>
                                                        <td className="px-4 py-3 text-right"><DeltaBadge value={m.deltaSpent} /></td>
                                                        <td className="px-4 py-3 text-right text-gray-500 tabular-nums">{m.completedCount}/{m.count}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                                                                <span className="text-xs text-gray-500 w-7 text-right">{pct.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-gray-200 bg-gray-50">
                                                <td className="px-4 py-3 text-xs font-bold text-gray-600">Total</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">R$ {fmt(metrics.totalPlanned)}</td>
                                                <td />
                                                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">R$ {fmt(metrics.totalSpent)}</td>
                                                <td /><td className="px-4 py-3 text-right text-sm font-bold text-gray-600">{metrics.completedItems}/{metrics.totalItems}</td>
                                                <td className="px-4 py-3 text-right text-xs text-gray-400">{metrics.totalItems > 0 ? ((metrics.completedItems / metrics.totalItems) * 100).toFixed(0) : 0}%</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            {monthlyStats.length >= 2 && (() => {
                                const last = monthlyStats[monthlyStats.length - 1], prev = monthlyStats[monthlyStats.length - 2];
                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[["Planejado", last.planned - prev.planned], ["Gasto", last.spent - prev.spent]].map(([lbl, diff]) => (
                                            <div key={lbl as string} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                                <p className="text-xs text-gray-400 font-medium mb-1">{lbl as string}: {last.label} vs {prev.label}</p>
                                                <p className={`text-lg font-bold ${(diff as number) > 0 ? "text-red-500" : "text-emerald-600"}`}>{(diff as number) > 0 ? "+" : ""}R$ {fmt(diff as number)}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{Math.abs(diff as number) < 0.01 ? "Igual" : (diff as number) > 0 ? "a mais que o mês anterior" : "a menos que o mês anterior"}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* ── F2 CATEGORIA ── */}
            {!emptyState && activeView === "categoria" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-700">Evolução Mensal por Categoria</h3>
                            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:border-primary bg-gray-50">
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {catMonthlyData && catMonthlyData.labels.length > 0 ? (
                            <div className="h-64"><Bar data={catMonthlyData} options={barOpts} /></div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Nenhum dado para {selectedCat}</div>
                        )}
                    </div>
                    {catMonthlyData && catMonthlyData.labels.length > 1 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tendência — {selectedCat}</h3>
                            <div className="h-48">
                                <Line
                                    data={{ labels: catMonthlyData.labels, datasets: [{ label: "Planejado (R$)", data: catMonthlyData.datasets[0].data, borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 2.5, pointBackgroundColor: "#6366f1", pointRadius: 4, tension: 0.35, fill: true }, { label: "Gasto (R$)", data: catMonthlyData.datasets[1].data, borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 2.5, pointBackgroundColor: "#10b981", pointRadius: 4, tension: 0.35, fill: true }] }}
                                    options={{ ...lineOpts, plugins: { ...lineOpts.plugins, legend: { display: true, position: "top" as const, labels: { font: { size: 12 }, color: "#6b7280" } } } }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── F6 HEATMAP ── */}
            {!emptyState && activeView === "mapa" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Mapa de Calor de Compras</h3>
                    <p className="text-xs text-gray-400 mb-4">Itens adicionados por dia (verde = mais compras)</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                            <div key={d} className="text-center text-[10px] text-gray-400 font-medium pb-1">{d}</div>
                        ))}
                        {/* fill leading blanks */}
                        {heatmapDays.length > 0 && (() => {
                            const firstDay = new Date(heatmapDays[0].date + "T12:00:00").getDay();
                            return Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);
                        })()}
                        {heatmapDays.map(({ date, count }) => (
                            <div
                                key={date}
                                title={`${date}: ${count} item${count !== 1 ? "s" : ""}`}
                                className="rounded aspect-square cursor-default transition-all hover:scale-110"
                                style={{ backgroundColor: heatColor(count) }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4 justify-end">
                        <span className="text-xs text-gray-400">Menos</span>
                        {["#f3f4f6", "#d1fae5", "#6ee7b7", "#10b981", "#065f46"].map(c => (
                            <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                        ))}
                        <span className="text-xs text-gray-400">Mais</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className={`${bg} p-2 rounded-xl shrink-0`}>{icon}</div>
            <div className="min-w-0"><p className="text-xs text-gray-500 font-medium truncate">{label}</p><p className="text-base font-bold text-gray-800 truncate">{value}</p></div>
        </div>
    );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${active ? "bg-primary text-white border-primary shadow-sm shadow-emerald-200" : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"}`}>
            {icon}{children}
        </button>
    );
}
