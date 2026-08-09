/**
 * Notifications are always scoped to the authenticated application user id (`users.id`).
 * Routes must never update/read by notification id alone.
 */
export function notificationBelongsToUser(notificationUserId: string, authUserId: string): boolean {
  return notificationUserId === authUserId
}
