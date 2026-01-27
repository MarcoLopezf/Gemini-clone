# PROJECT CONTEXT: Mini-Gemini Architect

## 1. Project Goal
Build a conversational AI Agent using **Next.js (App Router)** and **Google Genkit**.
The agent acts as an orchestrator using **Function Calling (Tools)** to decide between:
1. **Web Search:** Using Tavily API for real-time info.
2. **Local RAG:** Using an in-memory vector store with cosine similarity to query local private documentation.
3. **Generative Chat:** Using Gemini 1.5 Flash for general queries.

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode)
- **AI Core:** Google Genkit 
- **UI/Streaming:** Vercel AI SDK (`ai/react`)
- **Testing:** Vitest
- **Tools:** Tavily SDK, Local Vector Logic (cosine similarity).

---

## 3. MANDATORY DEVELOPMENT WORKFLOW (Strict TDD)

**You must follow this cycle for EVERY new feature:**

### PHASE 1: RED (The Stop)
1. Write the test first based on the requirements.
2. Run the test to confirm it FAILS.
3. **🛑 CRITICAL STOP:** Show the failing test output to the user. **DO NOT WRITE THE IMPLEMENTATION CODE YET.** Wait for the user to say "OK" or "Go ahead".

### PHASE 2: GREEN
1. Once confirmed, write the **minimum** amount of code necessary to make the test pass.
2. Do not over-engineer. Focus on passing the test.

### PHASE 3: REFACTOR & VERIFY
1. Refactor the code if needed (clean up, optimize) while keeping tests green.
2. Run the final verification command `pnpm verify` (Definition of Done for a FEATURE).

**Continuous Integration (Git Hooks):**
- **Commit:** Lint & Typecheck are auto-verified.
- **Push:** All tests are auto-verified.

**Definition of Done (Feature Complete):**
Run `pnpm verify`. It must result in:
- 0 Lint errors
- 0 Type errors
- All tests GREEN
- Build success

---

## 4. ARCHITECTURE RULES (DDD / Clean Architecture)

Strictly adhere to the **Dependency Rule**: Inner layers MUST NOT know about outer layers.

### 📂 Directory Structure
```text
src/
├── core/
│   ├── domain/        <-- PURE TS. Entities, Value Objects, Repository Interfaces. (NO Genkit/Nextjs imports)
│   └── application/   <-- Use Cases. Orchestration of domain logic.
├── infrastructure/    <-- ADAPTERS. Genkit implementation, Tavily API, InMemory DB, Next.js API Handlers.
└── app/               <-- UI/FRAMEWORK. React Components, Pages.

### Dependency Flow
App (UI) -> Infrastructure -> Application -> Domain

Domain: Defines what a Tool is (Interface).

Infrastructure: Defines how a Tool works (Implementation).

Application: Uses the Tool interface.

## 5. CODING STANDARDS
Naming: PascalCase for Classes, camelCase for variables/functions.

Explicit Types: Avoid any at all costs. Use Zod for runtime validation (especially for Tool Inputs).

Error Handling: Use typed errors or Result pattern where possible.

Environment: Use dotenv or Next.js env vars. Never hardcode keys.

## 6. CURRENT SESSION FOCUS
Implementing the Domain Layer first, followed by the Infrastructure (Genkit Adapter), and finally the Tools (RAG & Search) using the TDD workflow described above.