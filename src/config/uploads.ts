/**
 * File upload requirements for future customer/project portals.
 * Do not expose private uploads on a public static path.
 */
export const uploadPolicy = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFilesPerRequest: 5,
  allowedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
  ] as const,
  /** Server must generate opaque storage keys; never trust client filenames. */
  requireServerSideScan: true,
  requireAuthenticatedUploader: true,
  signedDownloadUrls: true,
} as const
