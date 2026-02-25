export enum ItemStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

export interface ShoppingItem {
    id: string;
    name: string;
    category: string;
    quantity?: string;
    price?: number;
    status: ItemStatus;
    createdAt?: string; // ISO date string
}

export interface CategoryGroup {
    category: string;
    items: ShoppingItem[];
}

export const DEFAULT_CATEGORIES = [
    "Frutas e Legumes",
    "Laticínios e Ovos",
    "Carne e Peixe",
    "Pães e Biscoitos",
    "Despensa",
    "Congelados",
    "Bebidas",
    "Outros",
];