/**
 * User-provided identity assets. Set `src` when files are added under /public/brand/.
 * Do not commit secrets or live API keys here.
 */
export type BrandAssetStatus = 'missing' | 'available'

export type BrandAsset = {
  id: string
  label: string
  status: BrandAssetStatus
  /** Public URL path when available */
  src?: string
  /** Recommended upload spec when missing */
  recommended?: {
    aspectRatio: string
    minWidthPx: number
    usage: string
  }
}

export type BrandAssetsMap = {
  logo: BrandAsset
  logoMark: BrandAsset
  founderPhoto: BrandAsset
  heroPoster: BrandAsset
}

const LOGO_MARK_SRC = '/brand/muco-logo-mark.png'
const FOUNDER_PHOTO_SRC = '/brand/Founder.png'

export const brandAssets: BrandAssetsMap = {
  logo: {
    id: 'logo',
    label: 'Official MUCO LABS logo',
    status: 'available',
    src: LOGO_MARK_SRC,
    recommended: {
      aspectRatio: '1:1 or wide lockup (SVG preferred)',
      minWidthPx: 512,
      usage: 'Site opening, navbar, footer, OG fallback',
    },
  },
  logoMark: {
    id: 'logo-mark',
    label: 'Logo mark (icon only)',
    status: 'available',
    src: LOGO_MARK_SRC,
    recommended: {
      aspectRatio: '1:1',
      minWidthPx: 256,
      usage: 'Favicon, compact nav, intro animation',
    },
  },
  founderPhoto: {
    id: 'founder-photo',
    label: 'Founder portrait — Srinivash Mahalingam',
    status: 'available',
    src: FOUNDER_PHOTO_SRC,
    recommended: {
      aspectRatio: '3:4 or 4:5 portrait',
      minWidthPx: 1200,
      usage: 'Homepage founder spotlight, About page',
    },
  },
  heroPoster: {
    id: 'hero-poster',
    label: 'WebGL hero fallback poster',
    status: 'missing',
    recommended: {
      aspectRatio: '16:9',
      minWidthPx: 1920,
      usage: 'R3F reduced-motion and mobile fallback for marketing hero scenes',
    },
  },
}

export function getMissingIdentityAssets(): BrandAsset[] {
  return Object.values(brandAssets).filter((asset) => asset.status === 'missing')
}
