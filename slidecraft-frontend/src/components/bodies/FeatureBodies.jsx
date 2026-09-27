export function Photo({ body }) {
  if (!body.imageUrl) return <div className="h-full w-full rounded bg-neutral-100" />
  return <img src={body.imageUrl} alt="" className="h-full w-full rounded object-cover" />
}

export function Statement({ body }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <p className="line-clamp-3 font-display text-lg font-bold text-white sm:text-xl">{body.statement}</p>
      {body.subtext && <p className="mt-2 line-clamp-2 max-w-sm text-xs text-white/70">{body.subtext}</p>}
    </div>
  )
}
