import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'

const privacy = pageSeo.privacy

export function PrivacyPolicyPage() {
  return (
    <PageShell
      title="Privacy policy"
      documentTitle={privacy.documentTitle}
      path={privacy.path}
      description={privacy.description}
    >
      <p>Structured legal content will be published in a dedicated compliance pass.</p>
    </PageShell>
  )
}
