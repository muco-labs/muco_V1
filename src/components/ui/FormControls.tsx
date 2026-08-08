import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import styles from './FormControls.module.css'

type FieldProps = {
  label: string
  id: string
  hint?: string
  error?: string
  className?: string
}

export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string
  children: string
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn(styles.label, className)}>
      {children}
    </label>
  )
}

export function Input({
  label,
  id,
  hint,
  error,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn(styles.field, className)}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        className={cn(styles.control, error && styles.controlError)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type SelectOption = { value: string; label: string }

export function Select({
  label,
  id,
  hint,
  error,
  className,
  options,
  ...props
}: FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
    options: SelectOption[]
  }) {
  return (
    <div className={cn(styles.field, className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={cn(styles.control, styles.select, error && styles.controlError)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function Textarea({
  label,
  id,
  hint,
  error,
  className,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn(styles.field, className)}>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className={cn(styles.control, styles.textarea, error && styles.controlError)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
