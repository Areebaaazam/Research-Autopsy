# Research Autopsy 🔬

> **AI-Powered Research Paper Analysis, Consistency Audit, & Experiment Workbench**

**Research Autopsy** is an advanced analysis platform designed for researchers, peer reviewers, and scientific authors. It extracts structured research findings, performs deterministic numerical consistency audits, identifies unaddressed research gaps, stress-tests methodologies against peer-reviewer attacks, and tracks paper revision progress over time.

---

## ✨ Key Features

- **📊 Real-time Paper Health Scorecard**: Evaluates paper strength with a composite rating based on claim verification, numerical consistency, research gap density, and open reviewer concerns.
- **🔍 Claim & Evidence Verification**: Extracts core research claims and pairs them directly with supporting textual evidence passages.
- **🔢 Deterministic Numerical Consistency Audit**: Automatically parses mathematical metrics, table results, and formulas in text to detect mathematical discrepancies and inconsistency flags.
- **💡 Research Gap Extraction**: Identifies author-acknowledged limitations, unaddressed field-wide gaps, and prospective research directions.
- **🛡️ Reviewer #2 Attack Simulator & Autopsy**: Stress-tests paper methodology to predict reviewer objections, fatal flaws, and recommended counter-experiments.
- **🔄 Revision Comparison & Snapshot Switcher**: Compare paper versions side-by-side to track resolved concerns and new findings across iterations.
- **⌨️ Command Palette (`Ctrl+K` / `Cmd+K`)**: Keyboard-first navigation, finding search, and rapid UI theme switching.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js 18+** and **npm** installed on your system.

### 2. Installation
Install dependencies for both the Express backend server and the React frontend:

```sh
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd .. && npm install
```

### 3. API Key Configuration (Optional)
Configure an API key in `server/.env` for full AI-powered analysis mode. Supported providers include **Groq** (default), **Google Gemini**, and **OpenAI**:

```sh
echo "GROQ_API_KEY=gsk_your_groq_api_key_here" > server/.env
```

*Note: If no API key is set, the application operates seamlessly in **Heuristic Mode** or **Demo Mode**.*

### 4. Running the Application
Start the backend server and Vite frontend development server:

```sh
# Start backend server (Port 3002)
cd server && node index.js &

# Start frontend application (Port 5173)
cd .. && npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Testing & Verification

Run the test suite powered by Vitest:

```sh
npm test
```

The test suite includes 78 tests covering quotation validation, text polish, deterministic numerical audit, and gap extraction error handling.

To build the production application:

```sh
npm run build
```

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons
- **Backend**: Express 5 (Node.js), PDF/Word document text extraction (`pdf-parse`, `mammoth`)
- **Testing**: Vitest, Testing Library, Playwright
- **AI Integration**: Groq (Qwen/Llama), Google Gemini, or OpenAI API
