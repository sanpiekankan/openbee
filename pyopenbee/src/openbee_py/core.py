from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any


ROLES: list[dict[str, str]] = [
    {
        "id": "worker",
        "name": "Worker Bee",
        "description": "General-purpose assistant for everyday tasks.",
        "system_prompt": (
            "You are a diligent Worker Bee in the OpenBee Hive. "
            "Assist users with general tasks efficiently and precisely."
        ),
    },
    {
        "id": "researcher",
        "name": "Researcher Bee",
        "description": "Specialized assistant for research and information synthesis.",
        "system_prompt": (
            "You are a Researcher Bee in the OpenBee Hive. "
            "Provide structured and accurate research-focused answers."
        ),
    },
    {
        "id": "architect",
        "name": "Architect Bee",
        "description": "Specialized assistant for system design and planning.",
        "system_prompt": (
            "You are an Architect Bee in the OpenBee Hive. "
            "Design robust, maintainable solutions with clear trade-offs."
        ),
    },
]


def list_roles() -> list[dict[str, str]]:
    return ROLES


def get_role(role_id: str) -> dict[str, str] | None:
    for role in ROLES:
        if role["id"] == role_id:
            return role
    return None


def ask_openbee(
    role: dict[str, str],
    task: str,
    api_key: str,
    model: str,
    base_url: str,
    temperature: float = 0.7,
    timeout: float = 60.0,
) -> str:
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": role["system_prompt"]},
            {"role": "user", "content": task},
        ],
    }
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"request failed: {exc.code} {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"request failed: {exc.reason}") from exc

    data: dict[str, Any] = json.loads(raw)
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("invalid response: missing choices")
    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("invalid response: missing content")
    return content
