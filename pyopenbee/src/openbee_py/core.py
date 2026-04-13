from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, TypedDict


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


class ProviderSpec(TypedDict):
    """Provider metadata used for config prompts and API routing."""

    id: str
    label: str
    default_model: str
    default_base_url: str
    api_style: str
    need_api_secret: bool


PROVIDERS: list[ProviderSpec] = [
    {
        "id": "openai",
        "label": "OpenAI (Global)",
        "default_model": "gpt-4o",
        "default_base_url": "https://api.openai.com/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "anthropic",
        "label": "Anthropic Claude (Global)",
        "default_model": "claude-3-7-sonnet-latest",
        "default_base_url": "https://api.anthropic.com",
        "api_style": "anthropic",
        "need_api_secret": False,
    },
    {
        "id": "google",
        "label": "Google Gemini (Global)",
        "default_model": "gemini-2.0-flash",
        "default_base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "xai",
        "label": "xAI Grok (Global)",
        "default_model": "grok-3-latest",
        "default_base_url": "https://api.x.ai/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "deepseek",
        "label": "DeepSeek (China)",
        "default_model": "deepseek-chat",
        "default_base_url": "https://api.deepseek.com/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "qwen",
        "label": "Qwen / DashScope (China)",
        "default_model": "qwen-max",
        "default_base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "kimi",
        "label": "Kimi / Moonshot (China)",
        "default_model": "kimi-k2-0711-preview",
        "default_base_url": "https://api.moonshot.cn/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "zhipu",
        "label": "Zhipu GLM (China)",
        "default_model": "glm-4-plus",
        "default_base_url": "https://open.bigmodel.cn/api/paas/v4",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "doubao",
        "label": "Doubao / Volcano Engine (China)",
        "default_model": "doubao-seed-1-6-flash-250715",
        "default_base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "hunyuan",
        "label": "Tencent Hunyuan (China)",
        "default_model": "hunyuan-large",
        "default_base_url": "https://api.hunyuan.cloud.tencent.com/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "baidu",
        "label": "Baidu Wenxin/Qianfan (China, AK/SK)",
        "default_model": "ernie-4.0-turbo-8k",
        "default_base_url": "https://qianfan.baidubce.com/v2",
        "api_style": "baidu_qianfan",
        "need_api_secret": True,
    },
    {
        "id": "minimax",
        "label": "MiniMax (China)",
        "default_model": "MiniMax-M1",
        "default_base_url": "https://api.minimax.chat/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "siliconflow",
        "label": "SiliconFlow (China)",
        "default_model": "deepseek-ai/DeepSeek-V3",
        "default_base_url": "https://api.siliconflow.cn/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "groq",
        "label": "Groq (Global)",
        "default_model": "llama-3.3-70b-versatile",
        "default_base_url": "https://api.groq.com/openai/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "ollama",
        "label": "Ollama (Local)",
        "default_model": "qwen2.5:7b",
        "default_base_url": "http://localhost:11434/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
    {
        "id": "custom",
        "label": "Custom OpenAI-Compatible",
        "default_model": "your-model",
        "default_base_url": "https://api.your-provider.com/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    },
]


def list_roles() -> list[dict[str, str]]:
    """Return all available bee roles."""
    return ROLES


def get_role(role_id: str) -> dict[str, str] | None:
    """Return role metadata by role id."""
    for role in ROLES:
        if role["id"] == role_id:
            return role
    return None


def list_providers() -> list[ProviderSpec]:
    """Return all built-in provider specs."""
    return PROVIDERS


def get_provider(provider_id: str) -> ProviderSpec:
    """Return provider spec by id, fallback to custom OpenAI-compatible provider."""
    for provider in PROVIDERS:
        if provider["id"] == provider_id:
            return provider
    return {
        "id": provider_id or "custom",
        "label": f"Custom ({provider_id})" if provider_id else "Custom",
        "default_model": "your-model",
        "default_base_url": "https://api.your-provider.com/v1",
        "api_style": "openai_compatible",
        "need_api_secret": False,
    }


def _request_json(
    request: urllib.request.Request,
    timeout: float,
) -> dict[str, Any]:
    """Execute a JSON HTTP request and return decoded response body."""
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"request failed: {exc.code} {details}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"request failed: {exc.reason}") from exc
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"invalid json response: {raw[:200]}") from exc


def _ask_openai_compatible(
    role: dict[str, str],
    task: str,
    api_key: str,
    model: str,
    base_url: str,
    temperature: float,
    timeout: float,
) -> str:
    """Call OpenAI-compatible /chat/completions providers."""
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": role["system_prompt"]},
            {"role": "user", "content": task},
        ],
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    data = _request_json(request, timeout=timeout)
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("invalid response: missing choices")
    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("invalid response: missing content")
    return content


def _is_temperature_one_only_error(error_message: str) -> bool:
    """Return True when provider indicates this model only supports temperature=1."""
    text = error_message.lower()
    return (
        "invalid temperature" in text
        and "only 1 is allowed" in text
    ) or "temperature only supports 1" in text


def _ask_anthropic(
    role: dict[str, str],
    task: str,
    api_key: str,
    model: str,
    base_url: str,
    temperature: float,
    timeout: float,
) -> str:
    """Call Anthropic native /v1/messages endpoint."""
    endpoint = f"{base_url.rstrip('/')}/v1/messages"
    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": 4096,
        "system": role["system_prompt"],
        "messages": [{"role": "user", "content": task}],
    }
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    data = _request_json(request, timeout=timeout)
    content_blocks = data.get("content")
    if not isinstance(content_blocks, list) or not content_blocks:
        raise RuntimeError("invalid response: missing content")
    first_block = content_blocks[0]
    text = first_block.get("text") if isinstance(first_block, dict) else None
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("invalid response: missing text")
    return text


def _get_baidu_access_token(api_key: str, api_secret: str, timeout: float) -> str:
    """Fetch Baidu Qianfan access token from AK/SK."""
    query = urllib.parse.urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": api_key,
            "client_secret": api_secret,
        }
    )
    endpoint = f"https://aip.baidubce.com/oauth/2.0/token?{query}"
    request = urllib.request.Request(endpoint, method="POST")
    data = _request_json(request, timeout=timeout)
    token = data.get("access_token")
    if not isinstance(token, str) or not token:
        raise RuntimeError("invalid Baidu token response")
    return token


def _ask_baidu_qianfan(
    role: dict[str, str],
    task: str,
    api_key: str,
    api_secret: str,
    model: str,
    base_url: str,
    temperature: float,
    timeout: float,
) -> str:
    """Call Baidu Qianfan chat endpoint with AK/SK."""
    token = _get_baidu_access_token(api_key=api_key, api_secret=api_secret, timeout=timeout)
    endpoint = f"{base_url.rstrip('/')}/chat/completions?access_token={urllib.parse.quote(token)}"
    payload = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": role["system_prompt"]},
            {"role": "user", "content": task},
        ],
    }
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    data = _request_json(request, timeout=timeout)
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("invalid response: missing choices")
    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("invalid response: missing content")
    return content


def ask_openbee(
    role: dict[str, str],
    task: str,
    provider: str,
    api_key: str,
    api_secret: str,
    model: str,
    base_url: str,
    api_style: str = "",
    temperature: float = 0.7,
    timeout: float = 60.0,
) -> str:
    """Route chat requests to provider-specific APIs."""
    # Avoid immediate timeout for providers with cold-start/queueing latency.
    effective_timeout = max(timeout, 60.0)
    style = api_style or get_provider(provider).get("api_style", "openai_compatible")
    if style == "anthropic":
        if not api_key:
            raise RuntimeError("api_key is required for Anthropic provider")
        return _ask_anthropic(
            role=role,
            task=task,
            api_key=api_key,
            model=model,
            base_url=base_url,
            temperature=temperature,
            timeout=effective_timeout,
        )
    if style == "baidu_qianfan":
        if not api_key or not api_secret:
            raise RuntimeError("api_key and api_secret are required for Baidu Qianfan provider")
        return _ask_baidu_qianfan(
            role=role,
            task=task,
            api_key=api_key,
            api_secret=api_secret,
            model=model,
            base_url=base_url,
            temperature=temperature,
            timeout=effective_timeout,
        )
    try:
        return _ask_openai_compatible(
            role=role,
            task=task,
            api_key=api_key,
            model=model,
            base_url=base_url,
            temperature=temperature,
            timeout=effective_timeout,
        )
    except RuntimeError as exc:
        # Some models (e.g. certain Kimi reasoning models) only accept temperature=1.
        if temperature != 1.0 and _is_temperature_one_only_error(str(exc)):
            return _ask_openai_compatible(
                role=role,
                task=task,
                api_key=api_key,
                model=model,
                base_url=base_url,
                temperature=1.0,
                timeout=effective_timeout,
            )
        raise
