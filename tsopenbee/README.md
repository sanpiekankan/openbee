# OpenBee TypeScript CLI

OpenBee TypeScript CLI 是 OpenBee 的 Node.js/TypeScript 版本基础命令行工具，和 `pyopenbee` 对齐提供最小可用能力：

- 查看内置 Bee 角色
- 配置 LLM 参数（`provider`、`apiKey`、`apiSecret`、`model`、`baseUrl`、`apiStyle`、`temperature`）
- 向指定角色发送任务并获取回复

## 安装

```bash
npm install -g @openbee/openbee
```

## 快速开始

### 1) 查看角色

```bash
openbee list
```

### 2) 配置模型

交互式配置：

```bash
openbee config
```

命令参数配置：

```bash
openbee config --provider openai --api-key <YOUR_API_KEY> --model gpt-4o
```

### 3) 发起任务

```bash
openbee ask worker "帮我规划一个后端服务结构"
```

## 配置说明

默认配置文件位置：

```text
~/.openbee/config.json
```

你也可以通过环境变量覆盖配置目录：

```bash
export OPENBEE_CONFIG_HOME=/path/to/custom/config
```

配置字段统一为驼峰命名（兼容读取历史下划线字段）：

- `apiKey`
- `apiSecret`
- `baseUrl`
- `apiStyle`

## 本地开发

```bash
npm install
npm run build
node dist/index.js list
```

## 许可证

MIT
