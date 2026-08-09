import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { FounderPortrait } from '@/components/content/FounderPortrait'
import { BreadcrumbSchema, PersonSchema } from '@/components/seo/StructuredData'
import { PageHero } from '@/components/design-system/PageHero'
import { FinalCta } from '@/components/design-system/FinalCta'
import { Reveal } from '@/components/motion/Reveal'
import { pageSeo } from '@/config/seo'
import { company } from '@/data/company'
import { founder } from '@/data/founder'
import { teamGroups, teamMembers, teamHiringNote } from '@/data/team'
import { deliveryProcess } from '@/content/process'
import { routePaths } from '@/config/routes'
import { env } from '@/config/env'
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
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'About', path: about.path },
        ]}
      />
      <PersonSchema
        name={founder.name}
        jobTitle={founder.title}
        description={founder.introduction}
        url={`${env.siteUrl}${about.path}#founder`}
      />
      <div className={styles.page}>
        <PageHero
          eyebrow="About"
          title="Technology with founder-led accountability."
          lead={company.tagline}
        >
          <p className={styles.heroSecondary}>{company.whoWeServe}</p>
          <nav className={styles.jumpNav} aria-label="On this page">
            <a className={styles.jumpLink} href="#founder">
              Founder
            </a>
            <a className={styles.jumpLink} href="#team">
              Team
            </a>
            <Link className={styles.jumpLink} to={routePaths.careers}>
              Careers
            </Link>
          </nav>
        </PageHero>

        <section className="section section--tight" aria-labelledby="about-who">
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-who" className="text-h2">
                  Who we are
                </h2>
              </Reveal>
              <div className={styles.prose}>
                {company.story.map((paragraph, index) => (
                  <Reveal key={paragraph.slice(0, 24)} delayMs={index * 60}>
                    <p className={styles.story}>{paragraph}</p>
                  </Reveal>
                ))}
                <Reveal delayMs={120}>
                  <p className={styles.disambiguation}>{company.disambiguation}</p>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="about-build">
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-build" className="text-h2">
                  What we build
                </h2>
                <p className={styles.story}>{company.whyWeExist}</p>
              </Reveal>
              <Reveal delayMs={80}>
                <ul className={styles.builds}>
                  {company.whatWeBuild.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="about-process">
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-process" className="text-h2">
                  How we work
                </h2>
                <p className={styles.story}>{company.howWeWork}</p>
              </Reveal>
              <Reveal delayMs={80}>
                <ol className={styles.process}>
                  {deliveryProcess.map((stage, index) => (
                    <li key={stage.step}>
                      <span className={styles.processIndex}>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong className={styles.processStep}>{stage.step}</strong>
                        <p>{stage.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="about-mission">
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-mission" className="text-h2">
                  Mission & vision
                </h2>
              </Reveal>
              <div className={styles.split}>
                <Reveal>
                  <h3 className="text-label">Mission</h3>
                  <p className={styles.missionCopy}>{company.mission}</p>
                </Reveal>
                <Reveal delayMs={80}>
                  <h3 className="text-label">Vision</h3>
                  <p className={styles.missionCopy}>{company.vision}</p>
                </Reveal>
              </div>
              <Reveal delayMs={120}>
                <div className={styles.philosophy}>
                  <h3 className="text-label">Engineering philosophy</h3>
                  <p className={styles.story}>{company.engineeringPhilosophy}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section section--tight" aria-labelledby="about-values">
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-values" className="text-h2">
                  Values
                </h2>
              </Reveal>
              <div className={styles.values}>
                {company.values.map((value, index) => (
                  <Reveal key={value.title} delayMs={index * 50}>
                    <article className="surface">
                      <h3 className="text-h3">{value.title}</h3>
                      <p>{value.body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className={`section ${styles.anchorSection}`}
          id="founder"
          aria-labelledby="about-founder"
        >
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-founder" className="text-h2">
                  Our founder
                </h2>
              </Reveal>
              <div className={styles.founder}>
                <Reveal>
                  <FounderPortrait
                    name={founder.name}
                    imageSrc={founder.imageSrc}
                    size="hero"
                    placeholderLabel="Founder photo"
                    loading="eager"
                  />
                </Reveal>
                <Reveal delayMs={100}>
                  <div className={styles.founderBody}>
                    <h3 className={styles.founderName}>{founder.name}</h3>
                    <p className={styles.founderTitle}>{founder.title}</p>
                    <p className={styles.founderIntro}>{founder.introduction}</p>
                    <div className={styles.founderDetail}>
                      <h4 className="text-label">Founder vision</h4>
                      <p className={styles.vision}>{founder.vision}</p>
                    </div>
                    <div className={styles.founderDetail}>
                      <h4 className="text-label">Role</h4>
                      <p>{founder.role}</p>
                    </div>
                    <div className={styles.founderDetail}>
                      <h4 className="text-label">Focus areas</h4>
                      <ul className={styles.skills}>
                        {founder.skills.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                    <p className={styles.founderPhilosophy}>{founder.philosophy}</p>
                    <ul className={styles.links}>
                      {founder.links.map((link) => (
                        <li key={link.href}>
                          <a className={styles.contactLink} href={link.href}>
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`section section--tight ${styles.anchorSection}`}
          id="team"
          aria-labelledby="about-team"
        >
          <div className="shell">
            <div className={styles.sectionBlock}>
              <Reveal>
                <h2 id="about-team" className="text-h2">
                  Team
                </h2>
                <p className={styles.teamNote}>{teamHiringNote}</p>
              </Reveal>
              <div className={styles.teamGrid}>
                {teamMembers.map((member, index) => (
                  <Reveal key={member.id} delayMs={index * 60}>
                    <article className={`surface ${styles.memberCard}`}>
                      <FounderPortrait
                        name={member.name}
                        imageSrc={member.imageSrc}
                        size="team"
                        objectPosition={member.imageObjectPosition}
                      />
                      <div className={styles.memberBody}>
                        <h3 className="text-h3">{member.name}</h3>
                        <p className={styles.memberRole}>{member.role}</p>
                        {member.bio ? <p className={styles.memberBio}>{member.bio}</p> : null}
                        {member.skills?.length ? (
                          <ul className={styles.memberSkills}>
                            {member.skills.map((skill) => (
                              <li key={skill}>{skill}</li>
                            ))}
                          </ul>
                        ) : null}
                        {member.links?.length ? (
                          <ul className={styles.memberLinks}>
                            {member.links.map((link) => (
                              <li key={link.href}>
                                <a className={styles.contactLink} href={link.href}>
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  </Reveal>
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
          </div>
        </section>

        <FinalCta
          title="Work with MUCO LABS"
          body="Tell us what you are building—we will respond with a practical next step."
          source="about"
          secondaryLabel="View work"
          secondaryHref={routePaths.work}
        />
      </div>
    </>
  )
}
