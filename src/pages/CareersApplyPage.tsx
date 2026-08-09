import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { CareerApplicationForm } from '@/components/careers/CareerApplicationForm'
import { pageSeo } from '@/config/seo'

const seo = pageSeo.careersApply

export function CareersApplyPage() {
  const [params] = useSearchParams()
  const jobSlug = params.get('job') ?? undefined
  const isGeneral = params.get('type') === 'general'

  const defaults = useMemo(
    () => ({
      defaultRoleInterest: isGeneral ? 'General Application' : '',
      defaultApplicationType: isGeneral ? 'general' : 'full_time',
    }),
    [isGeneral],
  )

  return (
    <PageShell
      title="Apply"
      documentTitle={seo.documentTitle}
      path={seo.path}
      description={seo.description}
    >
      <CareerApplicationForm jobOpeningSlug={jobSlug} {...defaults} />
    </PageShell>
  )
}
