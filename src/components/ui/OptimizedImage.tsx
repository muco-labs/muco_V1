import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  width: number
  height: number
}

export function OptimizedImage({
  className,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: OptimizedImageProps) {
  return (
    <img
      className={cn(className)}
      loading={loading}
      decoding={decoding}
      {...props}
    />
  )
}
