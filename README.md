# OpenBee 🐝

**Busy as a Bee, Smart as AI, Automated for You.**

OpenBee is a hive of specialized AI agents (Bees) working in harmony to help you build a user-friendly, strong, and secure AI agent/skills CLI tool. Each Bee has its own unique role and distinct capacity, contributing to complex task completion.

***

# 免责声明 & Disclaimer

&#x20;

本项目名称为 **openbee**，仅作为开源技术项目标识使用，与英国注册商标 **OPENBEE** 及其权利方 OPEN BEE FRANCE 无任何关联、授权、合作或隶属关系。

本项目**仅面向中华人民共和国境内用户提供服务**，不主动向英国、欧盟及其他境外地区提供、分发、推广或开展商业活动，不存在侵犯他人注册商标专用权的故意。

如相关权利方有异议，请通过项目渠道友好沟通，我将及时予以处理。

This open-source project operates under the name **openbee** for technical identification purposes only. It is **not affiliated with, authorized by, or associated in any way** with the UK registered trademark **OPENBEE** or its owner OPEN BEE FRANCE.

&#x20;

This project **provides services exclusively to users within the territory of the People's Republic of China**. It does not intentionally distribute, promote, or conduct commercial activities in the United Kingdom, the European Union, or other jurisdictions outside China. No trademark infringement is intended.

If any relevant rightsholder has concerns, please contact us through official project channels for amicable resolution.

<br />

## 🏗️ Hive Architecture

The core of OpenBee is built around the concept of a **Hive**, inspired by [OpenClaw](https://github.com/openclaw/openclaw).

- **Bee Roles**: Specialized agents with specific identities, system prompts, and capabilities.
  - **Worker Bee**: A general-purpose assistant for common tasks.
  - **Researcher Bee**: Specialized for deep research and information synthesis.
  - **Architect Bee**: Focused on system design and high-level planning.
- **Skill System**: A Markdown-based skill loader that allows defining agent capacities (e.g., [filesystem.md](skills/filesystem.md)) in a human-readable format.
- **Hive Registry**: A central hub that manages the lifecycle and summoning of different Bee roles.

***

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

***

## 📂 Project Structure

- `src/bees/`: Core logic for specialized agent roles.
- `src/skills/`: Loader for extensible agent capabilities.
- `src/cli/`: Command-line interface logic.
- `bees/`: External role definitions (Markdown).
- `skills/`: Global skill definitions (Markdown).

***

## 🤝 Join the Hive!

We are looking for talents to join this open-source project and build the future of AI automation! If you are interested in building a more user-friendly, secure, and robust AI agent system, check us out.

**GitHub**: <https://github.com/sanpiekankan/openbee>

***

## 📄 License

This project is licensed under the [MIT License](LICENSE).
