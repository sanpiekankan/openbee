from __future__ import annotations

import copy
import json
import os
from pathlib import Path
from typing import Any


DEFAULT_CONFIG: dict[str, Any] = {
    "llm": {
        "provider": "openai",
        "api_key": "",
        "api_secret": "",
        "model": "gpt-4o",
        "base_url": "https://api.openai.com/v1",
        "api_style": "openai_compatible",
        "temperature": 0.7,
    }
}


def get_config_dir() -> Path:
    """Return the config directory path for OpenBee."""
    custom = os.getenv("OPENBEE_CONFIG_HOME")
    if custom:
        return Path(custom).expanduser().resolve()
    return Path.home() / ".openbee"


def get_config_path() -> Path:
    """Return the config file path for OpenBee."""
    return get_config_dir() / "config.json"


def load_config() -> dict[str, Any]:
    """Load config from disk and merge it with defaults."""
    path = get_config_path()
    if not path.exists():
        return copy.deepcopy(DEFAULT_CONFIG)
    data = json.loads(path.read_text(encoding="utf-8"))
    merged = copy.deepcopy(DEFAULT_CONFIG)
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key].update(value)
            else:
                merged[key] = value
    return merged


def save_config(config: dict[str, Any]) -> None:
    """Persist config to disk as JSON."""
    path = get_config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")


def update_llm_config(**kwargs: Any) -> dict[str, Any]:
    """Update llm config fields and return the updated config."""
    config = load_config()
    llm = config.setdefault("llm", {})
    for key, value in kwargs.items():
        if value is not None:
            llm[key] = value
    save_config(config)
    return config
