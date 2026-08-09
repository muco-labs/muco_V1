export const employeePortalPaths = {
  root: '/team',
  tasks: '/team/tasks',
  taskDetail: (id: string) => `/team/tasks/${id}`,
  projects: '/team/projects',
  projectDetail: (id: string) => `/team/projects/${id}`,
  files: '/team/files',
  messages: '/team/messages',
  notifications: '/team/notifications',
  deadlines: '/team/deadlines',
  profile: '/team/profile',
  settings: '/team/settings',
} as const

export const employeeNavPrimary = [
  { label: 'Dashboard', path: employeePortalPaths.root, end: true },
  { label: 'My tasks', path: employeePortalPaths.tasks },
  { label: 'Projects', path: employeePortalPaths.projects },
  { label: 'Files', path: employeePortalPaths.files },
  { label: 'Messages', path: employeePortalPaths.messages },
  { label: 'Deadlines', path: employeePortalPaths.deadlines },
] as const

export const employeeNavMore = [
  { label: 'Notifications', path: employeePortalPaths.notifications },
  { label: 'Profile', path: employeePortalPaths.profile },
  { label: 'Settings', path: employeePortalPaths.settings },
] as const

/** @deprecated Use employeeNavPrimary + employeeNavMore */
export const employeeNav = [...employeeNavPrimary, ...employeeNavMore] as const

export const taskStatusLabels: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Completed',
}
