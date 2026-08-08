import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AnalyticsEventName } from '@/lib/analytics'
import { trackEvent } from '@/lib/analytics'
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
  trackEvent?: AnalyticsEventName
  trackParams?: Record<string, string>
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
  trackEvent: trackEventName,
  trackParams,
  ...props
}: ButtonProps) {
  const classes = cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  )

  const onTrack = () => {
    if (trackEventName) trackEvent(trackEventName, trackParams)
  }

  if ('to' in props && props.to) {
    const { to, onClick } = props
    return (
      <Link
        to={to}
        className={classes}
        onClick={() => {
          onTrack()
          onClick?.()
        }}
      >
        {children}
      </Link>
    )
  }

  const { type = 'button', onClick, ...buttonProps } = props as ButtonAsButton
  return (
    <button
      type={type}
      className={classes}
      onClick={(event) => {
        onTrack()
        onClick?.(event)
      }}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
