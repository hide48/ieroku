import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

// 一覧などの画面は 001 の PR 3 以降で作る。今は認証を通って表示されることの確認用
function Home() {
  return (
    <main className="mx-auto max-w-[640px] p-4">
      <h1 className="text-2xl font-bold">家録</h1>
      <p className="mt-2">準備中です。</p>
    </main>
  );
}
