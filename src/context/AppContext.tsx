import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken } from '../lib/api'
import type {
  CommunityPost,
  Mediation,
  RelationCategory,
  ScoreDimensions,
  UserProfile,
  UserSettings,
} from '../types'

interface AppState {
  user: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  apiOnline: boolean
  openrouterReady: boolean
  backendError: string | null
  login: (email: string, name?: string, password?: string) => Promise<void>
  logout: () => void
  completeOnboarding: (extra?: Partial<Pick<UserProfile, 'name' | 'bio' | 'city'>>) => Promise<void>
  setRole: (input: {
    role: string
    tenantId?: string
    intent?: string
    name?: string
    bio?: string
    city?: string
  }) => Promise<void>
  updateProfile: (patch: Partial<Pick<UserProfile, 'name' | 'bio' | 'city'>>) => Promise<void>
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
  updateMethodProgress: (id: string, progress: number) => Promise<void>
  addRelation: (input: {
    name: string
    category: Exclude<RelationCategory, 'Todas'>
    notes?: string
    email?: string
    phone?: string
  }) => Promise<void>
  updateRelation: (
    id: string,
    input: {
      name?: string
      category?: Exclude<RelationCategory, 'Todas'>
      notes?: string
      email?: string
      phone?: string
    },
  ) => Promise<void>
  removeRelation: (id: string) => Promise<void>
  createCompany: (body: Record<string, unknown>) => Promise<void>
  certifyCompany: (id: string) => Promise<void>
  createPartner: (body: Record<string, unknown>) => Promise<void>
  createInfluencer: (body: Record<string, unknown>) => Promise<void>
  createBenefit: (body: Record<string, unknown>) => Promise<void>
  evaluateRelation: (
    relationId: string,
    dimensions: ScoreDimensions,
    note?: string,
  ) => Promise<void>
  redeemBenefit: (benefitId: string, cost: number, title: string) => Promise<boolean>
  addMediation: (input: { title: string; withWhom: string; notes: string }) => Promise<void>
  updateMediationStatus: (
    id: string,
    status: Mediation['status'],
    agreement?: string,
  ) => Promise<void>
  advanceMediation: (id: string, userMessage: string) => Promise<void>
  sendChat: (text: string) => Promise<void>
  clearChat: () => Promise<void>
  acceptChallenge: () => Promise<void>
  progressChallenge: () => Promise<void>
  supportCause: (causeId: string, causeTitle: string, amount: number) => Promise<boolean>
  toggleFavoriteCompany: (companyId: string) => Promise<void>
  toggleFavoritePartner: (partnerId: string) => Promise<void>
  toggleFollowInfluencer: (influencerId: string) => Promise<void>
  addCompanyReview: (companyId: string, rating: number, comment: string) => Promise<void>
  likePost: (postId: string) => Promise<void>
  createCommunityPost: (input: {
    type: CommunityPost['type']
    title: string
    body: string
    tags: string[]
  }) => Promise<void>
  joinEvent: (eventId: string) => Promise<void>
  completeLibraryItem: (itemId: string, pillarId?: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  resetDemoData: () => Promise<void>
  refresh: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

function asUser(raw: unknown): UserProfile {
  return raw as UserProfile
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)
  const [openrouterReady, setOpenrouterReady] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)

  const applyUser = useCallback((raw: unknown) => {
    setUser(asUser(raw))
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    const { user } = await api.me()
    applyUser(user)
  }, [applyUser])

  useEffect(() => {
    ;(async () => {
      try {
        const h = await api.health()
        setApiOnline(h.ok)
        setOpenrouterReady(h.openrouter)
        setBackendError(null)
        if (getToken()) {
          await refresh()
        }
      } catch (e) {
        setApiOnline(false)
        setBackendError(
          e instanceof Error
            ? e.message
            : 'API offline. Suba o Docker (postgres) e o server.',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  const login = useCallback(
    async (email: string, name?: string, password = 'demo') => {
      setBackendError(null)
      try {
        // try login first; auto-creates if missing on server
        let data: { token: string; user: unknown }
        try {
          data = await api.login(email, password)
        } catch {
          data = await api.register(email, password, name)
        }
        setToken(data.token)
        applyUser(data.user)
        setApiOnline(true)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setBackendError(msg)
        throw e
      }
    },
    [applyUser],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const completeOnboarding = useCallback(
    async (extra?: Partial<Pick<UserProfile, 'name' | 'bio' | 'city'>>) => {
      const { user } = await api.patchMe({ ...extra, onboarded: true })
      applyUser(user)
    },
    [applyUser],
  )

  const setRole = useCallback(
    async (input: {
      role: string
      tenantId?: string
      intent?: string
      name?: string
      bio?: string
      city?: string
    }) => {
      if (input.name || input.bio || input.city) {
        await api.patchMe({
          name: input.name,
          bio: input.bio,
          city: input.city,
        })
      }
      const { user } = await api.setRole({
        role: input.role,
        tenantId: input.tenantId,
        intent: input.intent,
        onboarded: true,
      })
      applyUser(user)
    },
    [applyUser],
  )

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'name' | 'bio' | 'city'>>) => {
      const { user } = await api.patchMe(patch)
      applyUser(user)
    },
    [applyUser],
  )

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const { user } = await api.patchMe({ settings: patch })
      applyUser(user)
    },
    [applyUser],
  )

  const updateMethodProgress = useCallback(
    async (id: string, progress: number) => {
      const { user } = await api.method(id, progress)
      applyUser(user)
    },
    [applyUser],
  )

  const addRelation = useCallback(
    async (input: {
      name: string
      category: Exclude<RelationCategory, 'Todas'>
      notes?: string
      email?: string
      phone?: string
    }) => {
      const { user } = await api.addRelation(input)
      applyUser(user)
    },
    [applyUser],
  )

  const updateRelation = useCallback(
    async (
      id: string,
      input: {
        name?: string
        category?: Exclude<RelationCategory, 'Todas'>
        notes?: string
        email?: string
        phone?: string
      },
    ) => {
      const { user } = await api.updateRelation(id, input)
      applyUser(user)
    },
    [applyUser],
  )

  const removeRelation = useCallback(
    async (id: string) => {
      const { user } = await api.removeRelation(id)
      applyUser(user)
    },
    [applyUser],
  )

  const createCompany = useCallback(
    async (body: Record<string, unknown>) => {
      const { user } = await api.createCompany(body)
      applyUser(user)
    },
    [applyUser],
  )

  const certifyCompany = useCallback(
    async (id: string) => {
      const { user } = await api.certifyCompany(id)
      applyUser(user)
    },
    [applyUser],
  )

  const createPartner = useCallback(
    async (body: Record<string, unknown>) => {
      const { user } = await api.createPartner(body)
      applyUser(user)
    },
    [applyUser],
  )

  const createInfluencer = useCallback(
    async (body: Record<string, unknown>) => {
      const { user } = await api.createInfluencer(body)
      applyUser(user)
    },
    [applyUser],
  )

  const createBenefit = useCallback(
    async (body: Record<string, unknown>) => {
      const { user } = await api.createBenefit(body)
      applyUser(user)
    },
    [applyUser],
  )

  const evaluateRelation = useCallback(
    async (relationId: string, dimensions: ScoreDimensions, note?: string) => {
      const { user } = await api.evaluateRelation(relationId, dimensions, note)
      applyUser(user)
    },
    [applyUser],
  )

  const redeemBenefit = useCallback(
    async (benefitId: string, _cost: number, _title: string) => {
      try {
        const { user } = await api.redeemBenefit(benefitId)
        applyUser(user)
        return true
      } catch {
        return false
      }
    },
    [applyUser],
  )

  const addMediation = useCallback(
    async (input: { title: string; withWhom: string; notes: string }) => {
      const { user } = await api.addMediation(input)
      applyUser(user)
    },
    [applyUser],
  )

  const updateMediationStatus = useCallback(
    async (id: string, status: Mediation['status'], agreement?: string) => {
      const { user } = await api.patchMediation(id, { status, agreement })
      applyUser(user)
    },
    [applyUser],
  )

  const advanceMediation = useCallback(
    async (id: string, userMessage: string) => {
      const { user } = await api.mediationMessage(id, userMessage)
      applyUser(user)
    },
    [applyUser],
  )

  const sendChat = useCallback(
    async (text: string) => {
      // optimistic user bubble
      setUser((u) =>
        u
          ? {
              ...u,
              chat: [...u.chat, { role: 'user', text, createdAt: new Date().toISOString() }],
            }
          : u,
      )
      try {
        const { user } = await api.aiChat(text)
        applyUser(user)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setUser((u) =>
          u
            ? {
                ...u,
                chat: [
                  ...u.chat,
                  {
                    role: 'assistant',
                    text: `Erro na IA (OpenRouter/API): ${msg}`,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : u,
        )
      }
    },
    [applyUser],
  )

  const clearChat = useCallback(async () => {
    const { user } = await api.aiClear()
    applyUser(user)
  }, [applyUser])

  const acceptChallenge = useCallback(async () => {
    const { user } = await api.acceptChallenge()
    applyUser(user)
  }, [applyUser])

  const progressChallenge = useCallback(async () => {
    const { user } = await api.progressChallenge()
    applyUser(user)
  }, [applyUser])

  const supportCause = useCallback(
    async (causeId: string, _causeTitle: string, amount: number) => {
      try {
        const { user } = await api.supportCause(causeId, amount)
        applyUser(user)
        return true
      } catch {
        return false
      }
    },
    [applyUser],
  )

  const toggleFavoriteCompany = useCallback(
    async (companyId: string) => {
      const { user } = await api.favoriteCompany(companyId)
      applyUser(user)
    },
    [applyUser],
  )

  const toggleFavoritePartner = useCallback(
    async (partnerId: string) => {
      const { user } = await api.favoritePartner(partnerId)
      applyUser(user)
    },
    [applyUser],
  )

  const toggleFollowInfluencer = useCallback(
    async (influencerId: string) => {
      const { user } = await api.followInfluencer(influencerId)
      applyUser(user)
    },
    [applyUser],
  )

  const addCompanyReview = useCallback(
    async (companyId: string, rating: number, comment: string) => {
      const { user } = await api.reviewCompany(companyId, rating, comment)
      applyUser(user)
    },
    [applyUser],
  )

  const likePost = useCallback(
    async (postId: string) => {
      const { user } = await api.likePost(postId)
      applyUser(user)
    },
    [applyUser],
  )

  const createCommunityPost = useCallback(
    async (input: {
      type: CommunityPost['type']
      title: string
      body: string
      tags: string[]
    }) => {
      const { user } = await api.createPost(input)
      applyUser(user)
    },
    [applyUser],
  )

  const joinEvent = useCallback(
    async (eventId: string) => {
      const { user } = await api.joinEvent(eventId)
      applyUser(user)
    },
    [applyUser],
  )

  const completeLibraryItem = useCallback(
    async (itemId: string) => {
      const { user } = await api.completeLibrary(itemId)
      applyUser(user)
    },
    [applyUser],
  )

  const markNotificationRead = useCallback(
    async (id: string) => {
      const { user } = await api.readNotification(id)
      applyUser(user)
    },
    [applyUser],
  )

  const markAllNotificationsRead = useCallback(async () => {
    const { user } = await api.readAllNotifications()
    applyUser(user)
  }, [applyUser])

  const resetDemoData = useCallback(async () => {
    const { user } = await api.reset()
    applyUser(user)
  }, [applyUser])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      apiOnline,
      openrouterReady,
      backendError,
      login,
      logout,
      completeOnboarding,
      setRole,
      updateProfile,
      updateSettings,
      updateMethodProgress,
      addRelation,
      updateRelation,
      removeRelation,
      createCompany,
      certifyCompany,
      createPartner,
      createInfluencer,
      createBenefit,
      evaluateRelation,
      redeemBenefit,
      addMediation,
      updateMediationStatus,
      advanceMediation,
      sendChat,
      clearChat,
      acceptChallenge,
      progressChallenge,
      supportCause,
      toggleFavoriteCompany,
      toggleFavoritePartner,
      toggleFollowInfluencer,
      addCompanyReview,
      likePost,
      createCommunityPost,
      joinEvent,
      completeLibraryItem,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
      refresh,
    }),
    [
      user,
      loading,
      apiOnline,
      openrouterReady,
      backendError,
      login,
      logout,
      completeOnboarding,
      setRole,
      updateProfile,
      updateSettings,
      updateMethodProgress,
      addRelation,
      updateRelation,
      removeRelation,
      createCompany,
      certifyCompany,
      createPartner,
      createInfluencer,
      createBenefit,
      evaluateRelation,
      redeemBenefit,
      addMediation,
      updateMediationStatus,
      advanceMediation,
      sendChat,
      clearChat,
      acceptChallenge,
      progressChallenge,
      supportCause,
      toggleFavoriteCompany,
      toggleFavoritePartner,
      toggleFollowInfluencer,
      addCompanyReview,
      likePost,
      createCommunityPost,
      joinEvent,
      completeLibraryItem,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData,
      refresh,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
