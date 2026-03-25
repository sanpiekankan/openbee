# OpenBee 🐝

**Busy as a Bee, Smart as AI, Automated for You.**

OpenBee is a hive of specialized AI agents (Bees) working in harmony to help you build a user-friendly, strong, and secure AI agent/skills CLI tool. Each Bee has its own unique role and distinct capacity, contributing to complex task completion.

---

## 🏗️ Hive Architecture

The core of OpenBee is built around the concept of a **Hive**, inspired by [OpenClaw](https://github.com/openclaw/openclaw).

- **Bee Roles**: Specialized agents with specific identities, system prompts, and capabilities.
  - **Worker Bee**: A general-purpose assistant for common tasks.
  - **Researcher Bee**: Specialized for deep research and information synthesis.
  - **Architect Bee**: Focused on system design and high-level planning.
- **Skill System**: A Markdown-based skill loader that allows defining agent capacities (e.g., [filesystem.md](skills/filesystem.md)) in a human-readable format.
- **Hive Registry**: A central hub that manages the lifecycle and summoning of different Bee roles.

---

## 🚀 Getting Started

### Installation

```bash
npm install @openbee/openbee
```

### Usage

OpenBee provides a powerful CLI to interact with your hive.

#### Local Development Testing

If you are developing locally, you can test the features using `tsx`:

- **List available roles:**
  ```bash
  npx tsx src/index.ts list
  ```

- **Summon a bee for a task:**
  ```bash
  npx tsx src/index.ts ask researcher "Find information about climate change"
  ```

#### Production Usage

After installation, you can use the `openbee` command:

- **List available roles:**
  ```bash
  openbee list
  ```

- **Summon a bee for a task:**
  ```bash
  openbee ask worker "Create a new project structure"
  ```

---

## 📂 Project Structure

- `src/bees/`: Core logic for specialized agent roles.
- `src/skills/`: Loader for extensible agent capabilities.
- `src/cli/`: Command-line interface logic.
- `bees/`: External role definitions (Markdown).
- `skills/`: Global skill definitions (Markdown).

---

## 🤝 Join the Hive!

We are looking for talents to join this open-source project and build the future of AI automation! If you are interested in building a more user-friendly, secure, and robust AI agent system, check us out.

**GitHub**: [https://github.com/sanpiekankan/openbee](https://github.com/sanpiekankan/openbee)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
