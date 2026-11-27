# 0009 modern-web-guidance を参照ガイドとして採用

- 状態: 承認済み（2026-11-26）

## 背景

AI は学習時点の古い書き方をしがち。GoogleChrome/modern-web-guidance は、Chrome・Edge・Firefox・MDN の各チームが管理する、コーディングエージェント向けのモダンな Web のベストプラクティス集（スキル形式、Apache-2.0）。利用端末はひでが Android、妻が iPhone。

## 決定

- 参照ガイドとして採用する。**優先順位は ADR → CLAUDE.md → ガイド**
- shadcn/ui の部品はガイドに合わせて書き換えない。ガイドは自作部分（レイアウト、間取りのピン配置、フォーム検証、PWA、パフォーマンス）に適用する
- 対象ブラウザは Android Chrome と iOS Safari。使ってよいのは **Baseline Widely available** の機能。新しめの機能は代替手段がある場合のみ。Chrome 専用機能（組み込み AI の API など）は使わない
- 導入は特定のコミットのスキルファイルを `.claude/skills/` にコピーする。`npx modern-web-guidance@latest install` は使わない。更新時は差分をレビューする（0004）
- `legacy-scan` は振り返りのタイミングで手動実行する
- E2E は Chromium と WebKit の両方で行い、大きな機能は実機（iPhone・Android）でも確認する

## iPhone での注意

- PWA としてホーム画面に追加して使う前提（Web のプッシュ通知を使う場合に必要）
- Safari はしばらく使われないサイトのデータを消すことがあるため、端末側には一時キャッシュしか置かず、データは必ずサーバー（D1・R2）に保存する
- カメラ撮影は `<input type="file" accept="image/*" capture>` を使う

## 影響

- スキルの更新は手作業になる

## 見直す条件

- ガイドが ADR と頻繁に衝突する
