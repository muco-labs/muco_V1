import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'

const terms = pageSeo.terms

export function TermsPage() {
  return (
    <PageShell
      title="Terms"
      documentTitle={terms.documentTitle}
      path={terms.path}
      description={terms.description}
    >
      <p>Structured legal content will be published in a dedicated compliance pass.</p>
    </PageShell>
  )
}
