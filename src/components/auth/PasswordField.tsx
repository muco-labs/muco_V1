import { useId, useState } from 'react'
import formStyles from '@/pages/AuthForm.module.css'

type PasswordFieldProps = {
  id?: string
  label?: string
  autoComplete?: 'current-password' | 'new-password'
  required?: boolean
  minLength?: number
  value: string
  onChange: (value: string) => void
}

export function PasswordField({
  id: idProp,
  label = 'Password',
  autoComplete = 'current-password',
  required = true,
  minLength,
  value,
  onChange,
}: PasswordFieldProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className={formStyles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={formStyles.passwordWrap}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className={formStyles.passwordToggle}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
