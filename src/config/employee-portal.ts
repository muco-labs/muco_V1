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

export const employeeNav = [
  { label: 'Dashboard', path: employeePortalPaths.root, end: true },
  { label: 'My Tasks', path: employeePortalPaths.tasks },
  { label: 'Projects', path: employeePortalPaths.projects },
  { label: 'Files', path: employeePortalPaths.files },
  { label: 'Messages', path: employeePortalPaths.messages },
  { label: 'Notifications', path: employeePortalPaths.notifications },
  { label: 'Deadlines', path: employeePortalPaths.deadlines },
  { label: 'Profile', path: employeePortalPaths.profile },
  { label: 'Settings', path: employeePortalPaths.settings },
] as const

export const taskStatusLabels: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Completed',
}
