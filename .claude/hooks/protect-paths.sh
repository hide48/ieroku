#!/usr/bin/env bash
# PreToolUse フック: 保護対象のパスへの編集をブロックする（ADR 0006 / ADR 運用ルール）
# - .claude/ 配下は人間だけが変更する
# - 既存の ADR（docs/adr/*.md）は書き換えない。新しい ADR の作成のみ許可する
# 終了コード 2 でツールの実行をブロックし、stderr の内容が Claude に伝わる。
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$file_path" in
  /*) abs="$file_path" ;;
  *)  abs="$project_dir/$file_path" ;;
esac
rel="${abs#"$project_dir"/}"

case "$rel" in
  .claude/*)
    echo "ブロック: .claude/ 配下は人間がレビューして変更します。変更が必要なら差分案を提示してください。" >&2
    exit 2
    ;;
  docs/adr/*.md)
    if [ -e "$abs" ] && git -C "$project_dir" ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
      echo "ブロック: 承認済みの ADR は書き換えません。方針を変える場合は新しい ADR を作成し、置き換え関係を記載してください（後の変更は docs/adr/README.md の「その後」の欄に書きます）。" >&2
      exit 2
    fi
    ;;
esac

exit 0
