import { Link } from 'react-router-dom'
import { ProjectPreview } from '@/components/visual/ProjectPreview'
import { Badge } from '@/components/ui/Badge'
import type { PortfolioProject } from '@/content/portfolio'
import { portfolioKindLabel } from '@/content/portfolio'
import { servicePath } from '@/config/routes'
import { cn } from '@/utils/cn'
import styles from './ProjectCard.module.css'

type ProjectCardProps = {
  project: PortfolioProject
  detailHref?: string
}

export function ProjectCard({ project, detailHref }: ProjectCardProps) {
  return (
    <article className={cn('surface surface--lift', styles.card)}>
      <div className={styles.visual}>
        <ProjectPreview visual={project.visual} title={project.title} />
      </div>
      <div className={styles.body}>
        <Badge>{portfolioKindLabel(project.kind)}</Badge>
        <h3 className="text-h3">{project.title}</h3>
        <p className={styles.category}>{project.category}</p>
        <p className={styles.tagline}>{project.tagline}</p>
        <p className={styles.problem}>
          <strong>Problem:</strong> {project.problem}
        </p>
        <p className={styles.tech}>{project.technology.join(' · ')}</p>
        {project.relatedServiceSlug ? (
          <Link className="link-underline" to={servicePath(project.relatedServiceSlug)}>
            Related service
          </Link>
        ) : null}
        {detailHref ? (
          <Link className={cn('link-underline', styles.more)} to={detailHref}>
            View on Work page
          </Link>
        ) : null}
      </div>
    </article>
  )
}
