import type { AppRole } from './roles'
import { normalizeRole } from './roles'

/**
 * Permissões de ação no app.
 * O perfil (role) limita o que cada usuário pode criar/editar;
 * leitura de catálogos públicos é separada.
 */
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

/** Matriz por perfil — o que cada um PODE fazer */
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  /**
   * Pessoa: evolui relações, publica, consome marketplace.
   * Não cadastra empresas, benefícios, parceiros nem influenciadores.
   */
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
  /**
   * Empresa: edita só o próprio negócio e ofertas vinculadas.
   * Não gerencia relações pessoais nem cadastra influenciadores.
   */
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
  /**
   * Influenciador: conteúdo e perfil de voz; sem cadastros de marketplace.
   */
  influenciador: [
    'profile.edit',
    'method.edit',
    'influencers.view',
    'influencers.create',
    'community.post',
    'community.interact',
    'score.view',
  ],
  /**
   * Executivo: visão territorial e cadastros de expansão (parceiros/empresas do território).
   */
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
  /**
   * Mediador: fila e condução de mediações.
   */
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

export function canAny(role: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p))
}

export function permissionsFor(role: string | null | undefined): readonly Permission[] {
  const r = normalizeRole(role)
  return ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS.pessoa
}

/** Textos amigáveis do que cada perfil faz / não faz */
export const ROLE_CAPABILITY_SUMMARY: Record<
  Exclude<AppRole, 'admin'>,
  { can: string[]; cannot: string[] }
> = {
  pessoa: {
    can: [
      'Editar seu cadastro e preferências',
      'Gerenciar relações e avaliações',
      'Publicar na comunidade',
      'Ver e resgatar no marketplace',
      'Apoiar o Fundo e abrir mediações',
    ],
    cannot: [
      'Cadastrar empresas, benefícios ou parceiros',
      'Cadastrar perfil de influenciador',
      'Administrar território ou fila de mediação',
    ],
  },
  empresa: {
    can: [
      'Cadastrar e editar a sua empresa',
      'Solicitar certificação',
      'Criar benefícios e parceiros do negócio',
      'Publicar na comunidade',
    ],
    cannot: [
      'Editar empresas de terceiros',
      'Gerenciar círculo de relações pessoais',
      'Resgatar benefícios como consumidor (foco no negócio)',
      'Cadastrar influenciadores',
    ],
  },
  influenciador: {
    can: [
      'Editar perfil e voz na comunidade',
      'Cadastrar/atualizar perfil de influenciador',
      'Publicar conteúdo do bem',
      'Acompanhar Score e Método',
    ],
    cannot: ['Cadastrar empresas, marketplace ou parceiros', 'Gerir mediações ou território'],
  },
  executivo: {
    can: [
      'Ver painel do território',
      'Apoiar cadastros regionais de empresas e parceiros',
      'Acompanhar comunidade, fundo e mediações',
    ],
    cannot: ['Editar cadastro pessoal de terceiros', 'Atuar como mediador na fila'],
  },
  mediador: {
    can: [
      'Ver e conduzir a fila de mediações',
      'Abrir e responder mediações',
      'Usar Método e Score no apoio aos casos',
    ],
    cannot: ['Cadastrar empresas ou marketplace', 'Gerir painel de conteúdo de influenciador'],
  },
}
