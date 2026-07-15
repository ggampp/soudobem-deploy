import { normalizeRole, type AppRole } from './roles.js'

export type Permission =
  | 'profile.edit'
  | 'method.edit'
  | 'relations.manage'
  | 'companies.view'
  | 'companies.create'
  | 'companies.edit_own'
  | 'companies.certify_own'
  | 'companies.review'
  | 'benefits.view'
  | 'benefits.redeem'
  | 'benefits.create'
  | 'partners.view'
  | 'partners.create'
  | 'influencers.view'
  | 'influencers.create'
  | 'influencers.follow'
  | 'community.post'
  | 'community.interact'
  | 'mediations.create'
  | 'mediations.manage'
  | 'fundo.support'
  | 'challenge.use'
  | 'territory.view'
  | 'score.view'

const ALL: Permission[] = [
  'profile.edit',
  'method.edit',
  'relations.manage',
  'companies.view',
  'companies.create',
  'companies.edit_own',
  'companies.certify_own',
  'companies.review',
  'benefits.view',
  'benefits.redeem',
  'benefits.create',
  'partners.view',
  'partners.create',
  'influencers.view',
  'influencers.create',
  'influencers.follow',
  'community.post',
  'community.interact',
  'mediations.create',
  'mediations.manage',
  'fundo.support',
  'challenge.use',
  'territory.view',
  'score.view',
]

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  pessoa: [
    'profile.edit',
    'method.edit',
    'relations.manage',
    'companies.view',
    'companies.review',
    'benefits.view',
    'benefits.redeem',
    'partners.view',
    'influencers.view',
    'influencers.follow',
    'community.post',
    'community.interact',
    'mediations.create',
    'fundo.support',
    'challenge.use',
    'score.view',
  ],
  empresa: [
    'profile.edit',
    'companies.view',
    'companies.create',
    'companies.edit_own',
    'companies.certify_own',
    'benefits.view',
    'benefits.create',
    'partners.view',
    'partners.create',
    'community.post',
    'community.interact',
    'score.view',
  ],
  influenciador: [
    'profile.edit',
    'method.edit',
    'influencers.view',
    'influencers.create',
    'community.post',
    'community.interact',
    'score.view',
  ],
  executivo: [
    'profile.edit',
    'companies.view',
    'companies.create',
    'partners.view',
    'partners.create',
    'influencers.view',
    'community.post',
    'community.interact',
    'mediations.create',
    'fundo.support',
    'territory.view',
    'score.view',
  ],
  mediador: [
    'profile.edit',
    'method.edit',
    'mediations.create',
    'mediations.manage',
    'community.interact',
    'score.view',
  ],
  admin: ALL,
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  const r = normalizeRole(role)
  if (r === 'admin') return true
  return (ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS.pessoa).includes(permission)
}

export function denyMessage(role: string, permission: Permission) {
  return `Seu perfil "${role}" não tem permissão para esta ação (${permission}).`
}
