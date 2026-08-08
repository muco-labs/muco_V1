import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { pageSeo } from '@/config/seo'
import { analyticsEvents } from '@/lib/analytics'
import { company } from '@/data/company'
import { founder } from '@/data/founder'
import { teamGroups, teamMembers, teamHiringNote } from '@/data/team'
import { routePaths } from '@/config/routes'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const about = pageSeo.about

  return (
    <>
      <PageMeta
        documentTitle={about.documentTitle}
        description={about.description}
        path={about.path}
      />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">About</p>
              <h1 className="text-display">Technology with founder-led accountability.</h1>
              <p className={styles.lead}>{company.tagline}</p>
            </Reveal>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            {company.story.map((paragraph, index) => (
              <Reveal key={paragraph.slice(0, 24)} delayMs={index * 60}>
                <p className={styles.story}>{paragraph}</p>
              </Reveal>
            ))}
            <p className={styles.disambiguation}>{company.disambiguation}</p>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Mission & vision</h2>
            </Reveal>
            <div className={styles.split}>
              <Reveal>
                <h3 className="text-label">Mission</h3>
                <p>{company.mission}</p>
              </Reveal>
              <Reveal delayMs={80}>
                <h3 className="text-label">Vision</h3>
                <p>{company.vision}</p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Values</h2>
            </Reveal>
            <div className={styles.values}>
              {company.values.map((value) => (
                <article key={value.title} className="surface">
                  <h3 className="text-h3">{value.title}</h3>
                  <p>{value.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="founder">
          <div className="shell">
            <div className={styles.founder}>
              <Reveal>
                <FounderPortrait name={founder.name} imageSrc={founder.imageSrc} />
              </Reveal>
              <Reveal delayMs={100}>
                <p className="text-label">Founder</p>
                <h2 className="text-h2">{founder.name}</h2>
                <p className={styles.founderTitle}>{founder.title}</p>
                <p>{founder.introduction}</p>
                <p>{founder.philosophy}</p>
                <ul className={styles.links}>
                  {founder.links.map((link) => (
                    <li key={link.href}>
                      <a className="link-underline" href={link.href}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" id="team">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Team</h2>
              <p className={styles.teamNote}>{teamHiringNote}</p>
            </Reveal>
            <div className={styles.teamGrid}>
              {teamMembers.map((member) => (
                <article key={member.id} className={`surface ${styles.memberCard}`}>
                  <FounderPortrait name={member.name} imageSrc={member.imageSrc} size="md" />
                  <div>
                    <h3 className="text-h3">{member.name}</h3>
                    <p className={styles.memberRole}>{member.role}</p>
                    {member.bio ? <p>{member.bio}</p> : null}
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.teamGroups}>
              {teamGroups.map((group) => (
                <article key={group.id} className="surface">
                  <h3 className="text-label">{group.label}</h3>
                  <p className={styles.groupDesc}>{group.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal className={`surface ${styles.cta}`}>
              <h2 className="text-h2">Work with MUCO LABS</h2>
              <p>Tell us what you are building—we will respond with a practical next step.</p>
              <div className={styles.ctaActions}>
                <Button
                  to={routePaths.contact}
                  trackEvent={analyticsEvents.startProjectClick}
                  trackParams={{ source: 'about' }}
                >
                  Start a Project
                </Button>
                <Link className="link-underline" to={routePaths.work}>
                  Concept work
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  )
}
