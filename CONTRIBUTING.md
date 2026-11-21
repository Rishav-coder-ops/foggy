# 🤝 Contributing to Foggy

Thank you for your interest in contributing to **Foggy**! We welcome improvements from developers, designers, data scientists, and air quality researchers.

---

## 🛠️ Prerequisites & Setup

- **Node.js**: `v20.0.0` or higher (LTS recommended)
- **Package Manager**: `npm` or `pnpm`
- **Git**: Configured with your developer identity

### Clone and Install

```bash
git clone https://github.com/Rishav-coder-ops/foggy.git
cd foggy
npm install
```

---

## 📜 Available NPM Scripts

| Command                 | Description                                                                        |
| :---------------------- | :--------------------------------------------------------------------------------- |
| `npm run dev`           | Runs both local Express backend (`:3001`) and Vite frontend (`:5173`) concurrently |
| `npm run lint`          | Runs ESLint across all source, function, server, shared, and test files            |
| `npm run lint:fix`      | Automatically fixes auto-fixable ESLint issues                                     |
| `npm run format`        | Formats all files according to `.prettierrc`                                       |
| `npm run format:check`  | Verifies code formatting without altering files                                    |
| `npm test`              | Executes all 170+ unit and integration tests using Vitest in jsdom environment     |
| `npm run test:watch`    | Runs Vitest in interactive watch mode for active development                       |
| `npm run test:coverage` | Runs full v8 test coverage reporting (HTML & text summaries)                       |
| `npm run build`         | Lints the project first, then compiles production assets via Vite                  |

---

## 🧼 Code Quality & Style Standards

1. **Zero Warnings Policy**:
   - `npm run lint` must pass with **0 errors and 0 warnings**.
   - Unused imports, variables, and parameters must be cleaned up or prefixed with an underscore (`_`) if required by external interfaces.
2. **ESLint 9 Flat Config**:
   - Configured in `eslint.config.js` incorporating `react`, `react-hooks`, `jsx-a11y`, `import`, and strict `no-undef`.
3. **Prettier & EditorConfig**:
   - 2-space indentation, single quotes for JavaScript/JSX, trailing commas where valid ES5 allows.
4. **JSDoc & TypeScript Type Checking**:
   - All exported functions must feature standard JSDoc annotations documenting `@param` types and `@returns`.
   - `jsconfig.json` is configured with `"checkJs": true` for active editor validation.
5. **Pre-commit Hooks**:
   - Husky and `lint-staged` run automatically on `git commit`, validating staged files with ESLint and Prettier.

---

## 🧪 Testing Guidelines

1. **Test Runner**:
   - Tests are executed with **Vitest** and **React Testing Library** under a simulated `jsdom` browser environment.
2. **Test Design Principles**:
   - Follow **Arrange, Act, Assert (AAA)**.
   - Maintain descriptive test names explaining the exact business invariant being verified.
   - Avoid shared mutable state across test cases; clean up mocks in `beforeEach` with `vi.restoreAllMocks()`.
   - All tests must run 100% deterministically offline without network calls (use mocked fetch).
3. **Core Test Coverage**:
   - Maintain at least **80% lines and functions coverage** across core logic directories:
     - `shared/` (CPCB NAQI calculations, location aliases, constants)
     - `functions/api/` (rate limits, prompt sanitization, token verification)
     - `src/utils/` (care plan engine, form sanitization and validation)
     - `src/services/` (client API fallbacks and error handling)

---

## 🚀 Pull Request Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your edits following the architectural principles outlined in [`ARCHITECTURE.md`](ARCHITECTURE.md).
3. Verify your changes before pushing:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
4. Commit your changes using conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
5. Open a Pull Request on GitHub: [https://github.com/Rishav-coder-ops/foggy/pulls](https://github.com/Rishav-coder-ops/foggy/pulls).
