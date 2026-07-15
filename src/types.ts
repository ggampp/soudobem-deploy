export type RelationCategory =
  | 'Todas'
  | 'Família'
  | 'Amizade'
  | 'Trabalho'
  | 'Romântico'
  | 'Comunidade'

export type CompanySeal = 'Ouro' | 'Prata' | 'Bronze'
export type BenefitType = 'Cashback' | 'Produto' | 'Serviço' | 'Experiência' | 'Doação'
export type MediationStatus = 'aberta' | 'acordo' | 'resolvida'
export type CommunityPostType = 'conquista' | 'historia' | 'projeto' | 'evento' | 'dica'
export type NotificationType = 'score' | 'relation' | 'marketplace' | 'community' | 'system' | 'challenge'

export interface ScoreDimensions {
  confianca: number
  empatia: number
  etica: number
  cooperacao: number
  responsabilidade: number
}

export interface MethodPillar {
  id: string
  title: string
  description: string
  practices: string[]
  progress: number
}

export interface RelationEvaluation {
  id: string
  createdAt: string
  dimensions: ScoreDimensions
  note?: string
  average: number
}

export interface Relation {
  id: string
  name: string
  category: Exclude<RelationCategory, 'Todas'>
  score: number
  notes?: string
  email?: string
  phone?: string
  createdAt: string
  evaluations: RelationEvaluation[]
  lastInteractionAt?: string
}

export interface Company {
  id: string
  name: string
  initials: string
  category: string
  seal: CompanySeal
  score: number
  city: string
  state: string
  description: string
  website?: string
  phone?: string
  isCertified?: boolean
  createdBy?: string
}

export interface ScoreBreakdown {
  formula: string
  weights: { dimensions: number; method: number; relations: number }
  dimensionsAvg: number
  methodAvg: number
  relationsAvg: number | null
}

export interface ScoreEvent {
  id: string
  kind: string
  label: string
  scoreBefore: number
  scoreAfter: number
  meta?: Record<string, unknown>
  createdAt: string
}

export interface ScoreHistoryPoint {
  score: number
  methodAvg: number
  relationsAvg: number | null
  dimensions: ScoreDimensions
  createdAt: string
}

export interface CompanyReview {
  id: string
  companyId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Benefit {
  id: string
  title: string
  companyId: string
  type: BenefitType
  valueLabel: string
  cost: number
  featured?: boolean
}

export interface Influencer {
  id: string
  name: string
  handle: string
  niche: string
  bio: string
  score: number
  reach: string
  engagement: string
  verified: boolean
  rising?: boolean
}

export interface Cause {
  id: string
  title: string
  description: string
  raised: number
  goal: number
}

export interface GoodCoinTx {
  id: string
  label: string
  date: string
  amount: number
}

export interface MediationMessage {
  id: string
  role: 'user' | 'system' | 'ai'
  text: string
  createdAt: string
}

export interface Mediation {
  id: string
  title: string
  withWhom: string
  status: MediationStatus
  createdAt: string
  notes: string
  messages: MediationMessage[]
  agreement?: string
}

export interface Partner {
  id: string
  name: string
  category: string
  discount: string
  heartsRequired: number
  active: boolean
  address?: string
  companyId?: string
}

export interface TeamRow {
  name: string
  people: number
  score: number
  risk: 'baixo' | 'médio' | 'alto'
}

export interface CommunityPost {
  id: string
  type: CommunityPostType
  author: string
  title: string
  body: string
  likes: number
  createdAt: string
  tags: string[]
}

export interface CommunityEvent {
  id: string
  title: string
  date: string
  location: string
  description: string
  attendees: number
}

export interface LibraryItem {
  id: string
  title: string
  kind: 'vídeo' | 'artigo' | 'áudio' | 'prática'
  minutes: number
  pillar?: string
  summary: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export interface DailyChallengeState {
  id: string
  title: string
  description: string
  progress: number
  target: number
  rewardGc: number
  completed: boolean
  accepted: boolean
  daysLeft: number
  dimension?: keyof ScoreDimensions
  pillarId?: string
}

export interface UserSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  showScorePublicly: boolean
  allowRelationInvites: boolean
  theme: 'light' | 'system'
  language: 'pt-BR'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
}

export type AppRole =
  | 'pessoa'
  | 'empresa'
  | 'influenciador'
  | 'executivo'
  | 'mediador'
  | 'admin'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  region: string
  city?: string
  state?: string
}

export interface TenantMembership {
  id: string
  role: string
  status: string
  tenantId: string
  tenant: TenantInfo
}

export interface UserProfile {
  id?: string
  name: string
  email: string
  role: AppRole | string
  intent?: string
  onboarded: boolean
  bio?: string
  city?: string
  companyId?: string
  influencerId?: string
  primaryTenantId?: string
  tenant?: TenantInfo | null
  memberships?: TenantMembership[]
  score: number
  dimensions: ScoreDimensions
  streakDays: number
  lastChallengeDate?: string
  goodcoins: number
  hearts: number
  achievements: string[]
  seal: string
  method: MethodPillar[]
  relations: Relation[]
  mediations: Mediation[]
  goodcoinLedger: GoodCoinTx[]
  redeemedBenefitIds: string[]
  chat: ChatMessage[]
  favoriteCompanyIds: string[]
  favoritePartnerIds: string[]
  followingInfluencerIds: string[]
  companyReviews: CompanyReview[]
  communityPosts: CommunityPost[]
  likedPostIds: string[]
  joinedEventIds: string[]
  completedLibraryIds: string[]
  notifications: AppNotification[]
  challenge: DailyChallengeState
  settings: UserSettings
  causeContributions: Record<string, number>
  scoreBreakdown?: ScoreBreakdown
  scoreEvents?: ScoreEvent[]
  scoreHistory?: ScoreHistoryPoint[]
}
