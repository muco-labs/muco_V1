import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { founder } from '@/content/founder'
import { teamMembers, teamHiringNote } from '@/content/team'
import { routePaths } from '@/config/routes'
import styles from './HomeTeam.module.css'

export function HomeTeamSection() {
  return (
    <section className="section section--tight" aria-labelledby="home-team-title">
      <div className="shell">
        <Reveal className={styles.head}>
          <div>
            <p className="text-label">People</p>
            <h2 id="home-team-title" className="text-h2">
              Founder-led, specialist-backed.
            </h2>
            <p className={styles.note}>{teamHiringNote}</p>
          </div>
          <Link className="link-underline" to={`${routePaths.about}#team`}>
            About the team
          </Link>
        </Reveal>
        <div className={styles.grid}>
          {teamMembers.map((member, index) => (
            <Reveal key={member.id} delayMs={index * 80}>
              <article className={`surface surface--lift ${styles.card}`}>
                <FounderPortrait
                  name={member.name}
                  imageSrc={member.imageSrc}
                  size="md"
                  placeholderLabel="Team photo"
                />
                <div>
                  <h3 className="text-h3">{member.name}</h3>
                  <p className={styles.role}>{member.role}</p>
                  {member.bio ? <p className={styles.bio}>{member.bio}</p> : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className={styles.founderLink}>
          <p>
            <strong>{founder.name}</strong> — {founder.title}.{' '}
            <Link className="link-underline" to={`${routePaths.about}#founder`}>
              Read founder story
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
