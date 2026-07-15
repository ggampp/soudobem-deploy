// Em Docker/nginx: VITE_API_URL="" → mesmas origem (/api via proxy)
// Em dev local: VITE_API_URL=http://localhost:3001
const API_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : import.meta.env.DEV
      ? 'http://localhost:3001'
      : ''
const TOKEN_KEY = 'soudobem-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  health: () => request<{ ok: boolean; openrouter: boolean; model: string }>('/health'),
  login: (email: string, password: string) =>
    request<{ token: string; user: unknown }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: unknown }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => request<{ user: unknown }>('/api/me'),
  patchMe: (body: Record<string, unknown>) =>
    request<{ user: unknown }>('/api/me', { method: 'PATCH', body: JSON.stringify(body) }),
  method: (pillarKey: string, progress: number) =>
    request<{ user: unknown }>(`/api/method/${pillarKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    }),
  addRelation: (body: {
    name: string
    category: string
    notes?: string
    email?: string
    phone?: string
  }) =>
    request<{ user: unknown }>('/api/relations', { method: 'POST', body: JSON.stringify(body) }),
  updateRelation: (
    id: string,
    body: { name?: string; category?: string; notes?: string; email?: string; phone?: string },
  ) =>
    request<{ user: unknown }>(`/api/relations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeRelation: (id: string) =>
    request<{ user: unknown }>(`/api/relations/${id}`, { method: 'DELETE' }),
  evaluateRelation: (id: string, dimensions: unknown, note?: string) =>
    request<{ user: unknown }>(`/api/relations/${id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ dimensions, note }),
    }),
  acceptChallenge: () =>
    request<{ user: unknown }>('/api/challenge/accept', { method: 'POST', body: '{}' }),
  progressChallenge: () =>
    request<{ user: unknown }>('/api/challenge/progress', { method: 'POST', body: '{}' }),
  redeemBenefit: (id: string) =>
    request<{ user: unknown }>(`/api/benefits/${id}/redeem`, { method: 'POST', body: '{}' }),
  supportCause: (id: string, amount: number) =>
    request<{ user: unknown }>(`/api/causes/${id}/support`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  createPost: (body: { type: string; title: string; body: string; tags: string[] }) =>
    request<{ user: unknown }>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  likePost: (id: string) =>
    request<{ user: unknown }>(`/api/community/posts/${id}/like`, {
      method: 'POST',
      body: '{}',
    }),
  joinEvent: (id: string) =>
    request<{ user: unknown }>(`/api/community/events/${id}/join`, {
      method: 'POST',
      body: '{}',
    }),
  completeLibrary: (id: string) =>
    request<{ user: unknown }>(`/api/library/${id}/complete`, { method: 'POST', body: '{}' }),
  favoriteCompany: (id: string) =>
    request<{ user: unknown }>(`/api/companies/${id}/favorite`, { method: 'POST', body: '{}' }),
  reviewCompany: (id: string, rating: number, comment: string) =>
    request<{ user: unknown }>(`/api/companies/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
  followInfluencer: (id: string) =>
    request<{ user: unknown }>(`/api/influencers/${id}/follow`, { method: 'POST', body: '{}' }),
  addMediation: (body: { title: string; withWhom: string; notes?: string }) =>
    request<{ user: unknown }>('/api/mediations', { method: 'POST', body: JSON.stringify(body) }),
  mediationMessage: (id: string, text: string) =>
    request<{ user: unknown }>(`/api/mediations/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  patchMediation: (id: string, body: { status?: string; agreement?: string }) =>
    request<{ user: unknown }>(`/api/mediations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  readNotification: (id: string) =>
    request<{ user: unknown }>(`/api/notifications/${id}/read`, { method: 'POST', body: '{}' }),
  readAllNotifications: () =>
    request<{ user: unknown }>('/api/notifications/read-all', { method: 'POST', body: '{}' }),
  aiChat: (message: string) =>
    request<{ reply: string; user: unknown }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  aiClear: () => request<{ user: unknown }>('/api/ai/clear', { method: 'POST', body: '{}' }),
  reset: () => request<{ user: unknown }>('/api/me/reset', { method: 'POST', body: '{}' }),
  catalogCompanies: () => request<{ companies: unknown[] }>('/api/catalog/companies'),
  catalogBenefits: () => request<{ benefits: unknown[] }>('/api/catalog/benefits'),
  catalogInfluencers: () => request<{ influencers: unknown[] }>('/api/catalog/influencers'),
  catalogPartners: () => request<{ partners: unknown[] }>('/api/catalog/partners'),
  catalogCauses: () => request<{ causes: unknown[] }>('/api/catalog/causes'),
  catalogCommunity: () =>
    request<{ posts: unknown[]; events: unknown[]; library: unknown[] }>('/api/catalog/community'),
  createCompany: (body: Record<string, unknown>) =>
    request<{ id: string; user: unknown }>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCompany: (id: string, body: Record<string, unknown>) =>
    request<{ user: unknown }>(`/api/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  certifyCompany: (id: string) =>
    request<{ user: unknown }>(`/api/companies/${id}/certify-request`, {
      method: 'POST',
      body: '{}',
    }),
  createPartner: (body: Record<string, unknown>) =>
    request<{ id: string; user: unknown }>('/api/partners', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  favoritePartner: (id: string) =>
    request<{ user: unknown }>(`/api/partners/${id}/favorite`, { method: 'POST', body: '{}' }),
  createInfluencer: (body: Record<string, unknown>) =>
    request<{ id: string; user: unknown }>('/api/influencers', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createBenefit: (body: Record<string, unknown>) =>
    request<{ id: string; user: unknown }>('/api/benefits', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  scoreExplain: () => request<Record<string, unknown>>('/api/score/explain'),
  tenants: () =>
    request<{
      tenants: {
        id: string
        name: string
        slug: string
        region: string
        city: string
        state: string
        description: string
      }[]
      roles: Record<string, { label: string; tagline: string; description: string }>
    }>('/api/tenants'),
  setRole: (body: { role: string; tenantId?: string; intent?: string; onboarded?: boolean }) =>
    request<{ user: unknown }>('/api/me/role', { method: 'POST', body: JSON.stringify(body) }),
  executiveDashboard: (tenantId: string) =>
    request<Record<string, unknown>>(`/api/tenants/${tenantId}/dashboard`),
  panelEmpresa: () => request<Record<string, unknown>>('/api/panels/empresa'),
  panelInfluenciador: () => request<Record<string, unknown>>('/api/panels/influenciador'),
  panelMediador: () =>
    request<{ open: unknown[]; mine: unknown[] }>('/api/panels/mediador'),
  claimMediation: (id: string) =>
    request<{ user: unknown }>(`/api/mediations/${id}/claim`, { method: 'POST', body: '{}' }),
}

export { API_URL }
