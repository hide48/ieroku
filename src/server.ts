import { createServerEntry } from "@tanstack/react-start/server-entry";
import handler from "@tanstack/react-start/server-entry";

// 環境変数を読み込み時に検証する。不正なら例外で Worker が起動しない（.claude/rules/env-auth.md）
import "@/server/runtime";

export default createServerEntry({ fetch: handler.fetch });
