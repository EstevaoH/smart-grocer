# 🛒 SmartGrocer

Lista de compras inteligente com geração de ingredientes por IA.

## ✨ Funcionalidades

- **Adicionar itens manualmente** — com nome, quantidade, categoria e preço
- **Gerador de receitas** — descreva o prato e a IA sugere os ingredientes automaticamente
- **Análise de texto** — cole uma lista desestruturada e a IA organiza para você
- **Marcar como comprado** — acompanhe o progresso da sua lista em tempo real
- **Resumo financeiro** — total estimado e total já gasto
- **Compartilhar lista** — via Web Share API ou cópia para área de transferência
- **Persistência local** — os dados ficam salvos no `localStorage`

## 🚀 Como rodar

```bash
# Instale as dependências
npm install

# Configure a chave da API do Gemini
# Crie um arquivo .env.local na raiz:
GEMINI_API_KEY=sua_chave_aqui

# Rode em desenvolvimento
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

## 🛠 Stack

| Tecnologia | Uso |
|---|---|
| [Next.js 16](https://nextjs.org) | Framework React (App Router) |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilização |
| [Gemini API](https://ai.google.dev) | IA para geração de listas |
| [React Hook Form](https://react-hook-form.com) | Formulários |
| [Zod](https://zod.dev) | Validação de esquemas |
| [Lucide React](https://lucide.dev) | Ícones |

## 📁 Estrutura

```
app/
  page.tsx          # Página principal
  layout.tsx        # Layout global
  globals.css       # Estilos e tema

components/
  add-item.tsx      # Formulário de adição manual
  shopping-list.tsx # Lista de itens
  recipe-generator.tsx # Gerador por IA
  confirm-modal.tsx # Modal de confirmação
  alert-modal.tsx   # Modal de alerta

service/
  geminiService.ts  # Integração com Gemini API

types/
  shopping-item.ts  # Tipos e enums
```

## 📄 Licença

MIT © [Estevão](https://github.com/estevaoh)
