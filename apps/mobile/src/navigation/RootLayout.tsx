import { useEffect }           from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAuth, restoreSession }       from '../store/auth'

export default function RootLayout() {
  const { user, isLoading } = useAuth()
  const router   = useRouter()
  const segments = useSegments()

  useEffect(() => {
    restoreSession()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuth = segments[0] === '(auth)'

    if (!user && !inAuth) {
      router.replace('/(auth)/login')
      return
    }

    if (user?.mustChangePassword) {
      router.replace('/(auth)/set-password')
      return
    }

    if (user && inAuth) {
      router.replace('/(tabs)')
    }
  }, [user, isLoading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)"  />
      <Stack.Screen name="(tabs)"  />
    </Stack>
  )
}
