export const PROJECT_TEMPLATE_IDS = ['website', 'software'] as const

export type ProjectTemplateId = (typeof PROJECT_TEMPLATE_IDS)[number]

export type TemplateMilestone = {
  name: string
  description?: string
  tasks?: string[]
}

export type ProjectTemplate = {
  id: ProjectTemplateId
  label: string
  milestones: TemplateMilestone[]
}

export const PROJECT_TEMPLATES: Record<ProjectTemplateId, ProjectTemplate> = {
  website: {
    id: 'website',
    label: 'Website project',
    milestones: [
      { name: 'Discovery', tasks: ['Kickoff call', 'Stakeholder alignment'] },
      { name: 'Requirements', tasks: ['Content inventory', 'Sitemap & scope sign-off'] },
      { name: 'UI/UX', tasks: ['Wireframes', 'Visual design review'] },
      { name: 'Frontend', tasks: ['Responsive implementation', 'Accessibility pass'] },
      { name: 'Backend', tasks: ['CMS / API integration', 'Forms & lead capture'] },
      { name: 'Integration', tasks: ['Third-party hooks', 'Analytics & SEO tags'] },
      { name: 'Testing', tasks: ['QA checklist', 'Cross-browser review'] },
      { name: 'SEO', tasks: ['On-page SEO', 'Launch checklist'] },
      { name: 'Deployment', tasks: ['Production deploy', 'DNS & SSL verification'] },
      { name: 'Handover', tasks: ['Documentation', 'Client training'] },
    ],
  },
  software: {
    id: 'software',
    label: 'Software project',
    milestones: [
      { name: 'Discovery', tasks: ['Requirements workshop', 'Success criteria'] },
      { name: 'Architecture', tasks: ['Technical design', 'Security review'] },
      { name: 'UI/UX', tasks: ['Flows & prototypes', 'Design system alignment'] },
      { name: 'Development', tasks: ['Core features', 'Integrations'] },
      { name: 'Testing', tasks: ['Test plan', 'UAT support'] },
      { name: 'Deployment', tasks: ['Staging release', 'Production release'] },
      { name: 'Documentation', tasks: ['Runbooks', 'API / user docs'] },
      { name: 'Handover', tasks: ['Knowledge transfer', 'Support transition'] },
    ],
  },
}

export function isProjectTemplateId(value: string): value is ProjectTemplateId {
  return (PROJECT_TEMPLATE_IDS as readonly string[]).includes(value)
}

export function getProjectTemplate(id: ProjectTemplateId): ProjectTemplate {
  return PROJECT_TEMPLATES[id]
}
