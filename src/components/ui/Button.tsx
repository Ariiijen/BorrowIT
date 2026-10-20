import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'outline' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className = '', variant = 'primary', ...props }, ref) {
    const styles: Record<ButtonVariant, string> = {
      primary: 'border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800',
      outline: 'border border-zinc-300 bg-transparent text-zinc-800 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800',
      ghost: 'border border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800',
    }
    return (
      <button
        ref={ref}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 dark:focus-visible:ring-offset-zinc-950 ${styles[variant]} ${className}`}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
