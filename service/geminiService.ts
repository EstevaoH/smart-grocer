import { ItemStatus, ShoppingItem } from "@/types/shopping-item";
import { GoogleGenAI, Type, Schema } from "@google/genai";


const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Helper to create a UUID
const generateId = () => {
    // simple uuid replacement if uuid library isn't available, 
    // but typically we'd use crypto.randomUUID() in modern browsers
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
};

const ITEM_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Nome do produto de mercearia" },
                    quantity: { type: Type.STRING, description: "Quantidade do item (e.g., '2', '1 bunch', '500g')" },
                    category: {
                        type: Type.STRING,
                        description: "Categoria do item (e.g., Frutas e Legumes, Laticínios e Ovos, Carne e Peixe, Pães e Biscoitos, Despensa, Congelados, Bebidas, Outros)"
                    },
                },
                required: ["name", "category"],
            },
        },
    },
};

export const generateIngredientsFromRecipe = async (recipeName: string): Promise<ShoppingItem[]> => {
    if (!apiKey) {
        console.error("API Key is missing");
        return [];
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Gere uma lista de ingredientes para: "${recipeName}". 
        Ignore itens comuns como água, sal ou pimenta menos crucial.
     Categorize cada item amplamente (Frutas e Legumes, Laticínios e Ovos, Carne e Peixe, Pães e Biscoitos, Despensa, Congelados, Bebidas, Outros).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: ITEM_SCHEMA,
            },
        });

        const text = response.text;
        if (!text) return [];

        const data = JSON.parse(text);

        return (data.items || []).map((item: any) => ({
            id: generateId(),
            name: item.name,
            category: item.category || "Outros",
            quantity: item.quantity || "1",
            price: 0,
            status: ItemStatus.PENDING,
        }));

    } catch (error) {
        console.error("Error generating ingredients:", error);
        throw error;
    }
};

export const parseSmartList = async (input: string): Promise<ShoppingItem[]> => {
    if (!apiKey) {
        console.error("API Key is missing");
        return [];
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analise o texto bruto a seguir e transforme-o em uma lista de compras estruturada com categorias. 
      Input text: "${input}". 
      Se o texto implica uma receita específica, liste os ingredientes para ela.
      Se for apenas uma lista de itens, formate-os.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: ITEM_SCHEMA,
            },
        });

        const text = response.text;
        if (!text) return [];

        const data = JSON.parse(text);

        return (data.items || []).map((item: any) => ({
            id: generateId(),
            name: item.name,
            category: item.category || "Outros",
            quantity: item.quantity || "1",
            price: 0,
            status: ItemStatus.PENDING,
        }));

    } catch (error) {
        console.error("Error parsing smart list:", error);
        throw error;
    }
};