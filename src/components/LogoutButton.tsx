"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="border border-[var(--line)] px-6 py-3 text-sm"
      onClick={async () => {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
