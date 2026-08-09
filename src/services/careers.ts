import { ApiError, apiRequest } from '@/services/api'

export type CareerJobOpeningSummary = {
  id: string
  slug: string
  title: string
  department: string
  employmentType: string
  experienceLevel: string | null
  locationLabel: string | null
  remoteStatus: string | null
  shortDescription: string
  publishedAt: string | null
  closesAt: string | null
}

export type CareerJobOpeningDetail = CareerJobOpeningSummary & {
  responsibilities: string | null
  requiredSkills: string | null
  preferredSkills: string | null
}

export type CareerApplicationPayload = {
  jobOpeningId?: string
  jobOpeningSlug?: string
  fullName: string
  email: string
  phone?: string
  city?: string
  country?: string
  roleInterest: string
  applicationType: string
  experienceLevel?: string
  skills: string
  portfolioUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  introduction: string
  availability: string
  preferredEngagement?: string
  additionalInfo?: string
  website?: string
}

export type CareerApplicationResult =
  | {
      ok: true
      id: string
      reference: string
      resumeUploadAvailable: boolean
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export async function fetchCareerJobApplyContext(slug: string) {
  return apiRequest<{
    slug: string
    title: string
    acceptingApplications: boolean
    status: string
    message: string | null
  }>(`/api/v1/careers/openings/${encodeURIComponent(slug)}/apply-context`)
}

export async function fetchCareerOpenings(): Promise<CareerJobOpeningSummary[]> {
  const data = await apiRequest<{ items: CareerJobOpeningSummary[] }>('/api/v1/careers/openings')
  return data.items ?? []
}

export async function fetchCareerOpening(slug: string): Promise<CareerJobOpeningDetail> {
  return apiRequest<CareerJobOpeningDetail>(`/api/v1/careers/openings/${encodeURIComponent(slug)}`)
}

export async function submitCareerApplication(
  payload: CareerApplicationPayload,
): Promise<CareerApplicationResult> {
  if (payload.website?.trim()) {
    return { ok: true, id: 'accepted', reference: 'APP-ACCEPTED', resumeUploadAvailable: false }
  }

  try {
    const response = await apiRequest<{
      id: string
      reference: string
      resumeUploadAvailable: boolean
    }>('/api/v1/careers/applications', {
      method: 'POST',
      json: payload,
    })
    return {
      ok: true,
      id: response.id,
      reference: response.reference,
      resumeUploadAvailable: Boolean(response.resumeUploadAvailable),
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Unable to submit your application. Please try again later.' }
  }
}

export async function registerCareerResumeUpload(
  applicationId: string,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const meta = await apiRequest<{ uploadUrl: string }>(
      `/api/v1/careers/applications/${encodeURIComponent(applicationId)}/resume-upload`,
      {
        method: 'POST',
        json: {
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        },
      },
    )

    const upload = await fetch(meta.uploadUrl, {
      method: 'PUT',
      headers: file.type ? { 'Content-Type': file.type } : undefined,
      body: file,
    })

    if (!upload.ok) {
      return { ok: false, error: 'Resume upload failed. You can reply to our team with your CV by email.' }
    }

    return { ok: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Resume upload is not available right now.' }
  }
}
