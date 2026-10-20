export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`} />
}
