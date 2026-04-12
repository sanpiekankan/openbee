from __future__ import annotations

import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from openbee_py import cli
from openbee_py.config import get_config_path, load_config, update_llm_config


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
                self.assertEqual(config["llm"]["api_key"], "test-key")
                self.assertEqual(config["llm"]["model"], "gpt-4o-mini")
                self.assertTrue(get_config_path().exists())

    def test_ask_command_uses_client(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"OPENBEE_CONFIG_HOME": temp_dir}, clear=False):
                update_llm_config(api_key="k", model="m", base_url="https://api.openai.com/v1")
                with patch("openbee_py.cli.ask_openbee", return_value="ok") as mocked:
                    buf = io.StringIO()
                    with redirect_stdout(buf):
                        code = cli.main(["ask", "worker", "hello"])
                    self.assertEqual(code, 0)
                    self.assertIn("ok", buf.getvalue())
                    mocked.assert_called_once()


if __name__ == "__main__":
    unittest.main()
