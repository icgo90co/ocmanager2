import * as React from "react"
import { cn, getEstadoColor, getEstadoLabel } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'estado'
  estado?: string
}

function Badge({ className, variant = 'default', estado, children, ...props }: BadgeProps) {
  if (variant === 'estado' && estado) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          getEstadoColor(estado),
          className
        )}
        {...props}
      >
        {getEstadoLabel(estado)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === 'default',
          "border-transparent bg-secondary text-secondary-foreground": variant === 'secondary',
          "text-foreground": variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge }
