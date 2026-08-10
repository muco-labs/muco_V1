import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import { applyOAuthCallbackRecoveryIfNeeded } from '@/lib/auth/oauth-callback-recovery'
import { applyMarketingApexToWwwRedirect } from '@/lib/auth/marketing-www-redirect'
import App from '@/App.tsx'

const storedTheme = window.localStorage.getItem('muco-theme')
if (storedTheme === 'light') {
  document.documentElement.dataset.theme = 'light'
}

if (applyMarketingApexToWwwRedirect()) {
  // mucolabs.com → www.mucolabs.com (OAuth PKCE + sessionStorage)
} else if (applyOAuthCallbackRecoveryIfNeeded()) {
  // Full navigation to /auth/callback — do not mount React on /?code=...
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
