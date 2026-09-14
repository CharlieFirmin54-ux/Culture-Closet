import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="page-title mb-6 text-[2.5rem]">Account</h1>
      <div className="space-y-2 text-sm mb-8">
        <p>
          <span className="text-[var(--muted)]">Name:</span> {session.name}
        </p>
        <p>
          <span className="text-[var(--muted)]">Email:</span> {session.email}
        </p>
        <p>
          <span className="text-[var(--muted)]">Role:</span> {session.role}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/catalog" className="btn-dark px-6 inline-flex items-center">
          Continue shopping
        </Link>
        {session.role === "admin" && (
          <>
            <Link
              href="/admin"
              className="border border-ink px-6 py-3 inline-flex items-center text-sm font-semibold"
            >
              Inventory
            </Link>
            <Link
              href="/admin/pos"
              className="border border-ink px-6 py-3 inline-flex items-center text-sm font-semibold"
            >
              In-person POS
            </Link>
          </>
        )}
        <LogoutButton />
      </div>
    </div>
  );
}
