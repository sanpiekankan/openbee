from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from .config import load_config, update_llm_config
from .core import ask_openbee, get_role, list_roles


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="openbee",
        description="OpenBee Python CLI (basic commands)",
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="List available bee roles")

    config_parser = subparsers.add_parser("config", help="Show or update LLM config")
    config_parser.add_argument("--provider", help="LLM provider name")
    config_parser.add_argument("--api-key", help="LLM API key")
    config_parser.add_argument("--model", help="LLM model name")
    config_parser.add_argument("--base-url", help="OpenAI-compatible base URL")
    config_parser.add_argument("--temperature", type=float, help="Sampling temperature")

    ask_parser = subparsers.add_parser("ask", help="Ask a role to perform a task")
    ask_parser.add_argument("role", help="Role id, e.g. worker")
    ask_parser.add_argument("task", nargs="+", help="Task text")
    ask_parser.add_argument("--api-key", help="Override API key")
    ask_parser.add_argument("--model", help="Override model")
    ask_parser.add_argument("--base-url", help="Override base URL")
    ask_parser.add_argument("--temperature", type=float, help="Override temperature")

    return parser


def _run_list() -> int:
    roles = list_roles()
    for role in roles:
        print(f'{role["name"]} ({role["id"]})')
        print(f'  {role["description"]}')
    return 0


def _run_config(args: argparse.Namespace) -> int:
    has_updates = any(
        value is not None
        for value in (
            args.provider,
            args.api_key,
            args.model,
            args.base_url,
            args.temperature,
        )
    )
    if has_updates:
        config = update_llm_config(
            provider=args.provider,
            api_key=args.api_key,
            model=args.model,
            base_url=args.base_url,
            temperature=args.temperature,
        )
        print("Configuration updated.")
        print(json.dumps(config, ensure_ascii=False, indent=2))
        return 0

    config = load_config()
    print(json.dumps(config, ensure_ascii=False, indent=2))
    return 0


def _run_ask(args: argparse.Namespace) -> int:
    role = get_role(args.role)
    if role is None:
        print(f'Error: role "{args.role}" not found.', file=sys.stderr)
        return 1

    config = load_config().get("llm", {})
    api_key = args.api_key or config.get("api_key", "")
    model = args.model or config.get("model", "gpt-4o")
    base_url = args.base_url or config.get("base_url", "https://api.openai.com/v1")
    temperature = args.temperature if args.temperature is not None else float(config.get("temperature", 0.7))

    if not api_key:
        print('Error: API key missing. Run "openbee config --api-key <key>" first.', file=sys.stderr)
        return 1

    task = " ".join(args.task)
    try:
        content = ask_openbee(
            role=role,
            task=task,
            api_key=api_key,
            model=model,
            base_url=base_url,
            temperature=temperature,
        )
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(content)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "list":
        return _run_list()
    if args.command == "config":
        return _run_config(args)
    if args.command == "ask":
        return _run_ask(args)

    parser.print_help()
    return 0
