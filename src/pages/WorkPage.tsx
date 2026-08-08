import { PageMeta } from '@/components/seo/PageMeta'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { Reveal } from '@/components/motion/Reveal'
import { portfolioProjects } from '@/data/portfolio'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import styles from './WorkPage.module.css'

export function WorkPage() {
  return (
    <>
      <PageMeta
        title="Concept Work"
        description="MUCO LABS concept and demo projects—clearly labelled, designed to show capability without misrepresenting client work."
        path="/work"
      />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className="shell">
            <Reveal>
              <p className="text-label">Portfolio</p>
              <h1 className="text-h1">MUCO LABS concept work</h1>
              <p className={styles.lead}>
                Demonstrations and internal explorations—never presented as client case studies until
                verified stories are ready to publish.
              </p>
            </Reveal>
          </div>
        </section>
        <section className="section">
          <div className="shell">
            <div className={styles.grid}>
              {portfolioProjects.map((project, index) => (
                <Reveal key={project.id} delayMs={index * 80}>
                  <article className={`surface surface--lift ${styles.card}`}>
                    <ProjectPreview visual={project.visual} title={project.title} />
                    <div className={styles.body}>
                      <p className={styles.label}>{project.label}</p>
                      <h2 className="text-h3">{project.title}</h2>
                      <p className={styles.category}>{project.category}</p>
                      <p>
                        <strong>Problem:</strong> {project.problem}
                      </p>
                      <p>
                        <strong>Concept:</strong> {project.solution}
                      </p>
                      <p className={styles.tech}>{project.technology.join(' · ')}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className={styles.cta}>
              <Button to={routePaths.contact}>Discuss your project</Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
