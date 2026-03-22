"use client"

import { useAuth } from '@/firebase'

export function useCurrentUser() {
  const auth = useAuth()
  const user = auth?.currentUser

  return {
    uid: user?.uid ?? null,
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
    photoURL: user?.photoURL ?? null,
    isAuthenticated: !!user?.uid,
  }
}
