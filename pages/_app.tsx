import { AuthProvider } from '@/contexts/AuthContext'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps, router }: AppProps) {
  // Skip auth provider for auth pages
  const isAuthPage = router.pathname.startsWith('/auth/')

  if (isAuthPage) {
    return <Component {...pageProps} />
  }

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
