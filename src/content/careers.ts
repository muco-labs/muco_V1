export type CareerDepartment = {
  id: string
  label: string
  roles: string[]
}

export const careerDepartments: CareerDepartment[] = [
  {
    id: 'engineering',
    label: 'Engineering',
    roles: [
      'Frontend Developer',
      'Backend Developer',
      'Full-stack Developer',
      'Mobile Developer',
      'AI / Automation Developer',
      'QA / Testing',
      'DevOps / Cloud',
    ],
  },
  {
    id: 'design',
    label: 'Design',
    roles: ['UI/UX Designer', 'Product Designer', 'Graphic / Visual Designer'],
  },
  {
    id: 'growth',
    label: 'Growth',
    roles: ['SEO', 'Digital Marketing', 'Content', 'Social Media'],
  },
  {
    id: 'business',
    label: 'Business',
    roles: ['Business Development', 'Sales', 'Account Management'],
  },
  {
    id: 'operations',
    label: 'Operations',
    roles: ['Project Management', 'Operations'],
  },
  {
    id: 'other',
    label: 'Other',
    roles: ['General Application'],
  },
]

export const careerRoleOptions = careerDepartments.flatMap((dept) => dept.roles)

export const careersIntro = {
  headline:
    'MUCO Labs is building a technology company. We are interested in people who can contribute across engineering, design, growth, operations and related disciplines.',
  process:
    'Share your background and area of interest. We review applications for consideration—submission does not guarantee employment or engagement.',
  privacy:
    'Information you submit is used only for recruitment and talent consideration. We do not publish applications or share them publicly.',
}

export const applicationTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'general', label: 'General application' },
] as const

export const experienceLevelOptions = [
  'Student / Early career',
  'Junior',
  'Mid-level',
  'Senior',
  'Lead / Principal',
  'Not applicable',
]
