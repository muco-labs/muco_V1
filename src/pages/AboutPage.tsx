import { PageMeta } from '@/components/seo/PageMeta'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { company } from '@/data/company'
import { founder } from '@/data/founder'
import { teamArchitectureNote, teamGroups, teamMembers } from '@/data/team'
import { routePaths } from '@/config/routes'
import styles from './AboutPage.module.css'

const beliefs = [
  'Technology should reduce chaos—not add another system to fight.',
  'Design and engineering are one conversation, not a handoff.',
  'AI belongs where accountability and outcomes are measurable.',
]

const builds = [
  'Digital products & platforms',
  'Customer-facing experiences',
  'Internal operations software',
  'Automation & applied AI',
  'Growth & analytics systems',
]

export function AboutPage() {
  return (
    <>
      <PageMeta
        title="About MUCO LABS"
        description="MUCO LABS is a technology company from Erode building software, design and growth systems for ambitious teams."
        path="/about"
      />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">About</p>
              <h1 className="text-display">The new MUCO LABS headquarters.</h1>
              <p className={styles.lead}>{company.mission}</p>
            </Reveal>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal className={styles.split}>
              <h2 className="text-h2">Who we are</h2>
              <p>{company.positioning}</p>
            </Reveal>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">What we believe</h2>
            </Reveal>
            <ul className={styles.list}>
              {beliefs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">What we build</h2>
            </Reveal>
            <ul className={styles.builds}>
              {builds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="founder">
          <div className="shell">
            <div className={styles.founder}>
              <Reveal>
                <p className="text-label">Founder</p>
                <h2 className="text-h2">{founder.name ?? 'Founder profile'}</h2>
                <p className={styles.status}>
                  {founder.status === 'pending_verification'
                    ? 'Awaiting verified publication'
                    : founder.title}
                </p>
                <p>{founder.introduction}</p>
                {founder.role ? <p>{founder.role}</p> : null}
                {founder.vision ? <p className={styles.vision}>{founder.vision}</p> : null}
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" id="team">
          <div className="shell">
            <Reveal>
              <h2 className="text-h2">Team</h2>
              <p className={styles.teamNote}>{teamArchitectureNote}</p>
            </Reveal>
            <div className={styles.teamGroups}>
              {teamGroups.map((group) => (
                <article key={group.id} className="surface">
                  <h3 className="text-label">{group.label}</h3>
                  <ul>
                    {teamMembers
                      .filter((member) => member.group === group.id)
                      .map((member) => (
                        <li key={member.id}>
                          <strong>{member.name}</strong> — {member.role}
                        </li>
                      ))}
                    {teamMembers.filter((m) => m.group === group.id).length === 0 ? (
                      <li className={styles.empty}>Open — profiles publish when verified.</li>
                    ) : null}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="shell">
            <Reveal className={`surface ${styles.cta}`}>
              <h2 className="text-h2">Our vision</h2>
              <p>
                Build MUCO LABS into a durable technology company from {company.location.city}—trusted
                locally and competitive globally.
              </p>
              <Button to={routePaths.contact}>Start a Project</Button>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  )
}
