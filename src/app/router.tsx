import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'

function lazyPage<T extends Record<string, ComponentType<unknown>>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() =>
    loader().then((module) => ({
      default: module[exportName] as ComponentType<unknown>,
    })),
  )
}

const HomePage = lazyPage(() => import('@/pages/HomePage'), 'HomePage')
const ServicesPage = lazyPage(() => import('@/pages/ServicesPage'), 'ServicesPage')
const ServiceDetailPage = lazyPage(
  () => import('@/pages/ServiceDetailPage'),
  'ServiceDetailPage',
)
const SolutionsPage = lazyPage(
  () => import('@/pages/SolutionsPage'),
  'SolutionsPage',
)
const WorkPage = lazyPage(() => import('@/pages/WorkPage'), 'WorkPage')
const AboutPage = lazyPage(() => import('@/pages/AboutPage'), 'AboutPage')
const InsightsPage = lazyPage(() => import('@/pages/InsightsPage'), 'InsightsPage')
const ContactPage = lazyPage(() => import('@/pages/ContactPage'), 'ContactPage')
const PrivacyPolicyPage = lazyPage(
  () => import('@/pages/PrivacyPolicyPage'),
  'PrivacyPolicyPage',
)
const TermsPage = lazyPage(() => import('@/pages/TermsPage'), 'TermsPage')
const CookiePolicyPage = lazyPage(
  () => import('@/pages/CookiePolicyPage'),
  'CookiePolicyPage',
)
const NotFoundPage = lazyPage(() => import('@/pages/NotFoundPage'), 'NotFoundPage')

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/:slug', element: <ServiceDetailPage /> },
      { path: 'solutions', element: <SolutionsPage /> },
      { path: 'work', element: <WorkPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'cookie-policy', element: <CookiePolicyPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
