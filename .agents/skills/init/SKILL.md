---
name: init
description: Initialize and configure agent rules, guidelines, and project context for the current repository (equivalent to /init in Codex / Claude Code). Analyzes codebase, tech stack, package manager, scripts, and generates comprehensive AGENTS.md, GEMINI.md, or .agents/rules/ tailored to the project and Talenavi SOP standards.
---

# Skill: /init - Repository & Agent Context Initializer

This skill mimics the `/init` workflow from Codex / Claude Code to analyze the current workspace, discover tech stacks, and bootstrap full agent rules, project instructions, and architectural guidelines.

## When to Use

- User types `/init` or asks to initialize, bootstrap, or configure agent rules for the repository.
- Setting up new project context, `AGENTS.md`, `GEMINI.md`, or `.agents/rules/`.

---

## Workflow Steps

### Step 1: Scan & Discover Codebase Architecture

1. **Detect Tech Stack & Dependencies**:
   - Check `package.json`, `composer.json`, `pubspec.yaml`, `requirements.txt`, `go.mod`, `pom.xml`, etc.
   - Detect framework: (e.g., Vue 3 + Vite, Next.js, Laravel, Flutter, FastAPI, etc.).
   - Detect styling: (e.g., Tailwind CSS, UnoCSS, SCSS, shadcn/ui, Vuetify, etc.).
   - Detect state management & routing: (e.g., Pinia, Vue Router, Redux, Zustand).
   - Detect testing tools: (e.g., Vitest, Jest, Playwright, PHPUnit).
   - Detect linters / formatters: (e.g., ESLint, Prettier, Husky).

2. **Inspect Project Structure**:
   - Scan top-level folders (`src/`, `app/`, `components/`, `views/`, `pages/`, `services/`, `stores/`, `composables/`, `docs/`, `tests/`, etc.).
   - Check `.env.example` (DO NOT read `.env` directly).
   - Check existing `.agents/`, `AGENTS.md`, `GEMINI.md`, or rules.

3. **Check Talenavi SOP Compliance**:
   - Review `SOP-CODING-REPO.md` and related SOPs in `d:\MAGANG\TALENAVI\SOP-TALENAVI\`.
   - Ensure standards for commit messages (`<type>: [AA] ...`), branch conventions, naming conventions (`camelCase`/`PascalCase`), and single-responsibility principles are integrated.

---

### Step 2: Generate or Update Project Documentation & Rules

Generate a robust, comprehensive `AGENTS.md` (or `GEMINI.md` / `.agents/rules/`) at the project root with the following structure:

1. **Project Overview**:
   - Project name, purpose, and key features.
2. **Tech Stack & Tooling**:
   - Languages, framework versions, build tools, package managers (`pnpm`/`npm`/`yarn`/`composer`).
3. **Core Development Commands**:
   - Dev server command (`npm run dev` / `pnpm dev`).
   - Build & preview commands (`npm run build`).
   - Lint & format commands (`npm run lint`).
   - Test commands (`npm run test` / `pnpm vitest`).
4. **Architecture & Directory Map**:
   - Key directory paths and where specific types of code should live.
5. **Coding & Style Guidelines (Talenavi SOP)**:
   - Naming conventions (`camelCase` for vars/functions, `PascalCase` for components/classes).
   - English-only naming policy.
   - Input validation & error handling rules.
   - Component size limits (~300 lines guideline).
   - Git commit conventions (`<type>: [AA] description in English`).
6. **Testing & QA Standards**:
   - Test locations, test-runner commands, and quality requirements.

---

### Step 3: Present Summary to User

Provide a concise, professional report to the developer:

- Identified Tech Stack & Frameworks.
- Key scripts discovered.
- Files created/updated (`AGENTS.md` / `GEMINI.md`).
- Recommended next steps for development.
