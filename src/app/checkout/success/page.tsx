import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="page-title mb-4 text-[2.5rem]">Thank you</h1>
      <p className="text-[var(--muted)] mb-2">Your order is confirmed.</p>
      {order && (
        <p className="text-sm mb-8">
          Order ID: <span className="font-mono">{order}</span>
        </p>
      )}
      <Link href="/catalog" className="btn-dark inline-flex px-8">
        Keep shopping
      </Link>
    </div>
  );
}
