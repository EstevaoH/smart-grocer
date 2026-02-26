import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { monthLabel, itemMonthKey } from "./formatter-date";

export const exportCSV = (filtered: ShoppingItem[]) => {
    const header = "Produto,Categoria,Quantidade,Preço,Status,Mês\n";
    const rows = filtered.map(i =>
        `"${i.name}","${i.category || "Outros"}","${i.quantity || ""}","${(i.price || 0).toFixed(2)}","${i.status === ItemStatus.COMPLETED ? "Comprado" : "Pendente"}","${monthLabel(itemMonthKey(i))}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "smartgrocer-relatorio.csv"; a.click();
    URL.revokeObjectURL(url);
};