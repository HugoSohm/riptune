# Agent Instructions & Project Standards - RipTune

This document provides context and critical rules for AI agents working on the RipTune project.

## 1. Project Overview
RipTune is a premium music analyzer and downloader built with **Tauri v2**, **React**, and **Vite**. The application focuses on providing a high-end, native-like experience across macOS, Windows, and Linux, with professional dark aesthetics and seamless performance.

## 2. Useful Commands
*   `npm run dev` : Starts the full development environment (Vite + Tauri Dev).
*   `npm run build` : Builds production-ready bundles for all platforms.
*   `npm run frontend:dev` : Runs only the Vite frontend for rapid UI prototyping.
*   **Frontend Validation & Linting**:
    *   `npm run typecheck` : Runs the TypeScript type-checker (`tsc --noEmit`) to verify frontend type safety.
    *   `npm run lint` : Runs Biome to verify code formatting, structure, and quality rules in the `./src` directory.
    *   `npm run lint:fix` : Automatically formats and resolves fixable lint/style warnings using Biome.
*   **Backend Validation & Formatting (Rust)**:
    *   `npm run check:rs` : Runs `cargo check` to quickly verify Rust backend compilation.
    *   `npm run lint:rs` : Runs `cargo clippy` to check Rust code quality, standards, and warnings.
    *   `npm run format:rs` : Verifies Rust styling guidelines using `cargo fmt --check`.
    *   `npm run format:rs:fix` : Automatically formats all Rust source files in `src-tauri`.
    *   `npm run update:rs` : Runs `cargo update` on backend dependencies directly from the root directory.

## 3. Core Philosophy: "Native-First" (macOS)
*   **System Over Custom**: Never simulate in CSS what the OS can do natively (e.g., window borders, shadows, rounded corners).
*   **Window Configuration**: 
    *   Set `"transparent": false` to preserve the native macOS system border (thin white line) and shadow.
    *   Set `"backgroundColor": "#0a0f1c"` in `tauri.conf.json` to match the app's background and ensure perfect rounded corners.
    *   Set `"titleBarStyle": "Overlay"` to hide the default title bar while keeping native controls.

## 4. Tauri v2 Specifics (macOS)
*   **Traffic Lights Management**: Exclusively use the native `trafficLightPosition` in `tauri.conf.json`. 
    *   **Prohibition**: Never attempt to manipulate window buttons via Rust (`cocoa` or `objc`) as it causes click event interference (the "double-click" bug).
    *   **Standard Setting**: `{"x": 18, "y": 30}` for the current 60px header.
*   **User Interactions**: Use **`onMouseDown`** for interactive elements in the `TitleBar` to bypass macOS system focus delays.

## 5. Design & Code Style
*   **Aesthetics**: "Premium Dark" theme using `#0a0f1c`, `backdrop-blur` for overlays, and subtle micro-animations.
*   **Components**: 
    *   Icons: Use `lucide-react`.
    *   Z-index: The `TitleBar` must always be at the top (`z-[99999]`).
    *   Tooltips: Ensure they are not clipped (avoid `overflow-hidden` on TitleBar parents).
*   **Drag Region**: Strictly isolate `data-tauri-drag-region`. It must never overlap interactive buttons.
*   **Code Quality & Formatting (Biome)**: The project strictly uses **Biome** as its primary linter and formatter. Agents must fully adhere to the configuration defined in `biome.json` (2-space indent, double quotes, organized imports). Always run `npm run lint` or `npm run lint:fix` to auto-format and resolve linting errors before finalizing any frontend task.

## 6. Communication & Workflow
*   **Tone**: Concise, technical, and direct.
*   **Pre-Implementation Analysis**: Always check if a desired feature exists natively in Tauri v2 configuration before writing custom Rust code.
*   **Version-Specific Validation**: Before proposing any configuration or environment variable changes, the agent MUST explicitly check `package.json` or `Cargo.toml` to identify exact dependency versions. 
*   **Version Fidelity**: The agent must exclusively use documentation and best practices corresponding to the versions discovered in the project (Current: **Tauri v2**). Applying "legacy" knowledge (e.g., Tauri v1 conventions) without explicit verification is strictly prohibited.
*   **Documentation First**: For breaking version transitions (e.g., Tauri v1 -> v2), the agent is prohibited from relying on memory. It MUST use research tools to verify the current official documentation for that specific version.
*   **Code Hygiene**: Systematically remove unused imports and debug comments before finalizing a task.
*   **Changelog Writing**: When editing or updating `Changelog.md`, write clear, concise, and consumer-oriented entries aimed at end-users. Strictly avoid technical jargon, framework details, code snippets, or developer-focused concepts (e.g., do not mention component names, internal hooks, CSS layout methods, or browser/system APIs).
