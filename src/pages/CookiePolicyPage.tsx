import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'

const cookies = pageSeo.cookies

export function CookiePolicyPage() {
  return (
    <PageShell
      title="Cookie policy"
      documentTitle={cookies.documentTitle}
      path={cookies.path}
      description={cookies.description}
    >
      <p>Structured legal content will be published in a dedicated compliance pass.</p>
    </PageShell>
  )
}
