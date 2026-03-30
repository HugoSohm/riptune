# Contributing to RipTune

Thank you for your interest in contributing to RipTune! We are an open-source project and welcome contributions of all kinds.

## How to Contribute

### 1. Reporting Bugs
- Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template.
- Provide a clear description and steps to reproduce.
- Check if the issue has already been reported.

### 2. Suggesting Features
- Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template.
- Describe the feature and why it would be useful.

### 3. Submitting Pull Requests
1. **Fork** the repository.
2. **Create a new branch** for your feature or bugfix: `git checkout -b feature/my-new-feature`.
3. **Commit** your changes carefully.
4. **Push** your branch to your fork.
5. **Open a Pull Request** to the `main` branch.

## Development Workflow

### Requirements
- Node.js (Latest LTS version).
- Rust (Latest stable version).
- FFmpeg, yt-dlp, and Essentia binaries (via `npm run setup`).

### Commands
- Run in dev mode: `npm run tauri dev`.
- Build for production: `npm run tauri build`.

### Code Style
- Use standard Prettier and ESLint rules.
- Keep components small and modular.
- Add comments where logic is complex.

---

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
