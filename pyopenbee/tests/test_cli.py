from __future__ import annotations

import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from openbee_py import cli
from openbee_py.config import get_config_path, load_config, update_llm_config
from openbee_py.core import ask_openbee


class TestOpenBeePyCli(unittest.TestCase):
    def test_list_command(self) -> None:
        buf = io.StringIO()
        with redirect_stdout(buf):
            code = cli.main(["list"])
        output = buf.getvalue()
        self.assertEqual(code, 0)
        self.assertIn("Worker Bee (worker)", output)

    def test_config_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"OPENBEE_CONFIG_HOME": temp_dir}, clear=False):
                code = cli.main(
                    [
                        "config",
                        "--api-key",
                        "test-key",
                        "--model",
                        "gpt-4o-mini",
                    ]
                )
                self.assertEqual(code, 0)
                config = load_config()
                self.assertEqual(config["llm"]["apiKey"], "test-key")
                self.assertEqual(config["llm"]["model"], "gpt-4o-mini")
                self.assertTrue(get_config_path().exists())

    def test_ask_command_uses_client(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"OPENBEE_CONFIG_HOME": temp_dir}, clear=False):
                update_llm_config(apiKey="k", model="m", baseUrl="https://api.openai.com/v1")
                with patch("openbee_py.cli.ask_openbee", return_value="ok") as mocked:
                    buf = io.StringIO()
                    with redirect_stdout(buf):
                        code = cli.main(["ask", "worker", "hello"])
                    self.assertEqual(code, 0)
                    self.assertIn("ok", buf.getvalue())
                    mocked.assert_called_once()

    def test_load_config_supports_legacy_alias_and_sanitize(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"OPENBEE_CONFIG_HOME": temp_dir}, clear=False):
                path = get_config_path()
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(
                    json.dumps(
                        {
                            "llm": {
                                "provider": "kimi",
                                "apiKey": "sk-test-legacy",
                                "baseUrl": " `https://api.moonshot.cn/v1` ",
                                "model": " `kimi-k2.5` ",
                            }
                        }
                    ),
                    encoding="utf-8",
                )
                config = load_config()
                self.assertEqual(config["llm"]["apiKey"], "sk-test-legacy")
                self.assertEqual(config["llm"]["baseUrl"], "https://api.moonshot.cn/v1")
                self.assertEqual(config["llm"]["model"], "kimi-k2.5")

    def test_ask_openbee_retries_with_temperature_one(self) -> None:
        role = {"system_prompt": "x"}
        with patch(
            "openbee_py.core._ask_openai_compatible",
            side_effect=[
                RuntimeError('request failed: 400 {"error":{"message":"invalid temperature: only 1 is allowed"}}'),
                "ok",
            ],
        ) as mocked:
            result = ask_openbee(
                role=role,
                task="hello",
                provider="kimi",
                api_key="k",
                api_secret="",
                model="kimi-k2.5",
                base_url="https://api.moonshot.cn/v1",
                temperature=0.0,
            )
            self.assertEqual(result, "ok")
            self.assertEqual(mocked.call_count, 2)


if __name__ == "__main__":
    unittest.main()
