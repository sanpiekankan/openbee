# OpenBee Python CLI

OpenBee Python CLI 是 OpenBee 的 Python 版本基础命令行工具，提供最小可用能力：

- 查看内置 Bee 角色
- 配置 LLM 参数（API Key、模型、Base URL、温度）
- 向指定角色发送任务并获取回复

## 安装

```bash
pip install openbee
```

## 快速开始

### 1) 查看角色

```bash
openbee list
```

### 2) 配置模型

```bash
openbee config --api-key <YOUR_API_KEY> --model gpt-4o
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

## 许可证

MIT
