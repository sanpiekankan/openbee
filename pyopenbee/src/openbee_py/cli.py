from __future__ import annotations

import argparse
import getpass
import json
import sys
from typing import Sequence

from .config import load_config, update_llm_config
from .core import ask_openbee, get_provider, list_providers, get_role, list_roles


def _build_parser() -> argparse.ArgumentParser:
    """Build and return the CLI parser."""
    parser = argparse.ArgumentParser(
        prog="openbee",
        description="OpenBee Python CLI (basic commands)",
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="List available bee roles")

    config_parser = subparsers.add_parser("config", help="Show or update LLM config")
    config_parser.add_argument("--provider", help="LLM provider name")
    config_parser.add_argument("--api-key", help="LLM API key")
    config_parser.add_argument("--api-secret", help="LLM API secret (if required)")
    config_parser.add_argument("--model", help="LLM model name")
    config_parser.add_argument("--base-url", help="OpenAI-compatible base URL")
    config_parser.add_argument("--api-style", help="API style override")
    config_parser.add_argument("--temperature", type=float, help="Sampling temperature")

    ask_parser = subparsers.add_parser("ask", help="Ask a role to perform a task")
    ask_parser.add_argument("role", help="Role id, e.g. worker")
    ask_parser.add_argument("task", nargs="+", help="Task text")
    ask_parser.add_argument("--provider", help="Override provider")
    ask_parser.add_argument("--api-key", help="Override API key")
    ask_parser.add_argument("--api-secret", help="Override API secret")
    ask_parser.add_argument("--model", help="Override model")
    ask_parser.add_argument("--base-url", help="Override base URL")
    ask_parser.add_argument("--api-style", help="Override API style")
    ask_parser.add_argument("--temperature", type=float, help="Override temperature")

    return parser


def _run_list() -> int:
    """Handle `openbee list` command."""
    roles = list_roles()
    for role in roles:
        print(f'{role["name"]} ({role["id"]})')
        print(f'  {role["description"]}')
    return 0


def _prompt_text(message: str, default: str = "", secret: bool = False) -> str:
    """Prompt user for text input and return provided value or default."""
    hint = f" [{default}]" if default else ""
    prompt = f"{message}{hint}: "
    value = getpass.getpass(prompt) if secret else input(prompt)
    return value.strip() if value.strip() else default


def _prompt_float(message: str, default: float) -> float:
    """Prompt user for float value with a default fallback."""
    while True:
        raw = _prompt_text(message, default=f"{default}")
        try:
            return float(raw)
        except ValueError:
            print("Invalid number, please try again.")


def _interactive_config() -> int:
    """Run interactive provider configuration flow."""
    config = load_config().get("llm", {})
    providers = list_providers()
    current_provider = str(config.get("provider", "openai"))

    print("Select a model provider:")
    for index, provider in enumerate(providers, start=1):
        marker = " (current)" if provider["id"] == current_provider else ""
        print(f'  {index}. {provider["label"]} [{provider["id"]}]{marker}')

    default_index = 1
    for index, provider in enumerate(providers, start=1):
        if provider["id"] == current_provider:
            default_index = index
            break

    while True:
        raw_selection = _prompt_text("Provider number", default=str(default_index))
        if raw_selection.isdigit():
            selection = int(raw_selection)
            if 1 <= selection <= len(providers):
                break
        print(f"Please enter a number between 1 and {len(providers)}.")

    selected = providers[selection - 1]
    default_model = str(config.get("model") or selected["default_model"])
    default_base_url = str(config.get("base_url") or selected["default_base_url"])
    default_temperature = float(config.get("temperature", 0.7))

    model = _prompt_text("Model name", default=default_model)
    base_url = _prompt_text("Base URL", default=default_base_url)
    api_key = _prompt_text("API Key", default=str(config.get("api_key", "")), secret=True)
    api_secret = ""
    if selected["need_api_secret"]:
        api_secret = _prompt_text(
            "API Secret",
            default=str(config.get("api_secret", "")),
            secret=True,
        )
    temperature = _prompt_float("Temperature", default=default_temperature)

    updated = update_llm_config(
        provider=selected["id"],
        api_key=api_key,
        api_secret=api_secret,
        model=model,
        base_url=base_url,
        api_style=selected["api_style"],
        temperature=temperature,
    )
    print("Configuration updated.")
    print(json.dumps(updated, ensure_ascii=False, indent=2))
    return 0


def _run_config(args: argparse.Namespace) -> int:
    """Handle `openbee config` command in CLI or interactive mode."""
    has_updates = any(
        value is not None
        for value in (
            args.provider,
            args.api_key,
            args.api_secret,
            args.model,
            args.base_url,
            args.api_style,
            args.temperature,
        )
    )
    if has_updates:
        config = update_llm_config(
            provider=args.provider,
            api_key=args.api_key,
            api_secret=args.api_secret,
            model=args.model,
            base_url=args.base_url,
            api_style=args.api_style,
            temperature=args.temperature,
        )
        print("Configuration updated.")
        print(json.dumps(config, ensure_ascii=False, indent=2))
        return 0

    return _interactive_config()


def _run_ask(args: argparse.Namespace) -> int:
    """Handle `openbee ask` command."""
    role = get_role(args.role)
    if role is None:
        print(f'Error: role "{args.role}" not found.', file=sys.stderr)
        return 1

    config = load_config().get("llm", {})
    provider = args.provider or config.get("provider", "openai")
    provider_spec = get_provider(str(provider))
    api_key = args.api_key or config.get("api_key", "")
    api_secret = args.api_secret or config.get("api_secret", "")
    model = args.model or config.get("model", "gpt-4o")
    base_url = args.base_url or config.get("base_url", provider_spec["default_base_url"])
    api_style = args.api_style or config.get("api_style", provider_spec["api_style"])
    temperature = args.temperature if args.temperature is not None else float(config.get("temperature", 0.7))

    if not api_key and provider != "ollama":
        print('Error: API key missing. Run "openbee config" to set it first.', file=sys.stderr)
        return 1
    if provider_spec["need_api_secret"] and not api_secret:
        print(
            f'Error: API secret missing for provider "{provider}". Run "openbee config" to set it first.',
            file=sys.stderr,
        )
        return 1

    task = " ".join(args.task)
    try:
        content = ask_openbee(
            role=role,
            task=task,
            provider=str(provider),
            api_key=api_key,
            api_secret=api_secret,
            model=model,
            base_url=base_url,
            api_style=str(api_style),
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
