export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <h1 className="page-title mb-6">Contact</h1>
      <p className="text-[var(--muted)] leading-relaxed mb-8">
        Questions about sizing, pickup, or delivery? Message us on WhatsApp —
        we reply fast.
      </p>
      <a
        href="https://wa.me/447359938605"
        className="btn-dark inline-flex px-8"
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp 07359938605
      </a>
      <div className="mt-12 space-y-3 text-sm">
        <p>
          <span className="font-semibold">Pickup & delivery:</span> Pay with
          Apple Pay in person when you collect or when we drop off.
        </p>
        <p>
          <span className="font-semibold">Online:</span> Apple Pay and Google
          Pay at checkout.
        </p>
      </div>
    </div>
  );
}
