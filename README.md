# Research Autopsy

AI-powered research paper analysis tool. Upload a PDF, and the app extracts structured information, identifies research gaps, checks idea novelty, stress-tests methodology, and more.

## Status

Early development. Core extraction and gap analysis work. Expect rough edges and incomplete features.

## Quick Start

```sh
# Install dependencies
cd server && npm install
cd .. && npm install

# Set API key (Groq, Google, or OpenAI)
#   gsk_...   → Groq (default)
#   AIza...   → Google Gemini
#   sk-...    → OpenAI
echo 'GROQ_API_KEY=gsk_your_key_here' > server/.env

# Start backend + frontend
cd server && node index.js &
cd .. && npm run dev
```

Open http://localhost:5173. Upload a PDF (survey papers work best) and explore the modules.

## Tests

```sh
npx vitest run
```

78 tests across 4 suites: quotation validation, text polish, numerical audit, and gap extraction + error handling.

## Tech

- Frontend: React 19, TypeScript, Vite, Tailwind 4
- Backend: Express 5, PDF text extraction
- AI: Groq (qwen), Google Gemini, or OpenAI