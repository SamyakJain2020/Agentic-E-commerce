export default function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-display text-xl font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 font-sans text-sm font-bold text-white">A</span>
              Aura
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">Everyday essentials, styled with intent. Shopped autonomously with Ava — by text, or by voice.</p>
          </div>
          {[
            { title: 'Shop', items: ['Shirts', 'Outerwear', 'Footwear', 'Groceries'] },
            { title: 'Support', items: ['Track Order', 'Returns', 'Shipping', 'Contact'] },
            { title: 'Company', items: ['About', 'Careers', 'Press', 'Sustainability'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-neutral-900">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((i) => (
                  <li key={i} className="text-sm text-neutral-500 transition hover:text-neutral-900">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Aura, Inc. Demo storefront — agentic commerce showcase.</span>
          <span>Built with an autonomous shopping agent, real-time voice, and biometric checkout.</span>
        </div>
      </div>
    </footer>
  )
}
