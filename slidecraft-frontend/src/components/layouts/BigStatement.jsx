export default function BigStatement({ data, brand }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl px-8 text-center" style={{ background: brand.primaryHex }}>
      <p className="line-clamp-3 font-display text-2xl font-bold text-white sm:text-3xl">{data.statement}</p>
      {data.subtext && <p className="mt-3 line-clamp-2 max-w-lg text-sm text-white/70">{data.subtext}</p>}
    </div>
  )
}
