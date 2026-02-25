// User profile stored in localStorage under "smartgrocer_user_v1"

export const STORAGE_USER_KEY = "smartgrocer_user_v1";

export const DEFAULT_CATEGORIES = [
    "Frutas e Verduras",
    "Laticínios",
    "Carnes e Peixes",
    "Padaria",
    "Bebidas",
    "Limpeza",
    "Higiene",
    "Mercearia",
    "Congelados",
    "Outros",
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    EUR: "€",
};

// Alias for convenient access: CURRENCIES["BRL"] → "R$"
export const CURRENCIES = CURRENCY_SYMBOLS;

export interface UserProfile {
    name: string;
    emoji: string;
    currency: "BRL" | "USD" | "EUR";
    budgetGoal: number;
    defaultCategories: string[];
    setupCompleted: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
    name: "",
    emoji: "🛒",
    currency: "BRL",
    budgetGoal: 0,
    defaultCategories: [...DEFAULT_CATEGORIES],
    setupCompleted: false,
};

export function loadProfile(): UserProfile {
    try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
}
