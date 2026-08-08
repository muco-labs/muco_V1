import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type CommonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  fullWidth?: boolean
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined
  }

type ButtonAsLink = CommonProps & {
  to: string
  onClick?: () => void
}

export type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth,
  ...props
}: ButtonProps) {
  const classes = cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  )

  if ('to' in props && props.to) {
    const { to, onClick } = props
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }

  const { type = 'button', ...buttonProps } = props as ButtonAsButton
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
