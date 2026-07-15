export type AppRole =
  | 'pessoa'
  | 'empresa'
  | 'influenciador'
  | 'executivo'
  | 'mediador'
  | 'admin'

export const APP_ROLES: AppRole[] = [
  'pessoa',
  'empresa',
  'influenciador',
  'executivo',
  'mediador',
  'admin',
]

export const ROLE_META: Record<
  Exclude<AppRole, 'admin'>,
  { label: string; tagline: string; description: string }
> = {
  pessoa: {
    label: 'Pessoa',
    tagline: 'Quero evoluir minhas relações.',
    description:
      'Score do Bem, Método, círculo de relações, desafios diários e consumo consciente no marketplace.',
  },
  empresa: {
    label: 'Empresa',
    tagline: 'Quero certificar meu negócio.',
    description:
      'Cadastro e certificação da empresa, benefícios no Marketplace, reputação e avaliações de clientes.',
  },
  influenciador: {
    label: 'Influenciador',
    tagline: 'Quero criar conteúdo do bem.',
    description:
      'Perfil público, publicações na comunidade, biblioteca e engajamento com propósito.',
  },
  executivo: {
    label: 'Líder / Executivo',
    tagline: 'Quero atuar no território.',
    description:
      'Painel regional multi-tenant: empresas, mediações, comunidade e expansão do movimento.',
  },
  mediador: {
    label: 'Mediador',
    tagline: 'Quero ajudar a resolver conflitos.',
    description:
      'Fila de mediações do território, aceitar casos e conduzir acordos com humanidade.',
  },
}

/** Rotas (prefixo /app) permitidas por perfil. admin vê tudo. */
export const ROLE_NAV: Record<AppRole, string[]> = {
  pessoa: [
    '',
    'metodo',
    'score',
    'relacoes',
    'empresas',
    'beneficios',
    'parceiros',
    'fundo',
    'mediacao',
    'comunidade',
    'ia',
    'perfil',
  ],
  empresa: [
    '',
    'score',
    'empresas',
    'beneficios',
    'parceiros',
    'comunidade',
    'ia',
    'perfil',
    'painel-empresa',
  ],
  influenciador: [
    '',
    'score',
    'influenciadores',
    'comunidade',
    'metodo',
    'ia',
    'perfil',
    'painel-conteudo',
  ],
  executivo: [
    '',
    'executivo',
    'empresas',
    'parceiros',
    'comunidade',
    'mediacao',
    'fundo',
    'score',
    'ia',
    'perfil',
  ],
  mediador: ['', 'mediacao', 'score', 'metodo', 'ia', 'perfil', 'painel-mediador'],
  admin: [
    '',
    'metodo',
    'score',
    'relacoes',
    'empresas',
    'influenciadores',
    'beneficios',
    'parceiros',
    'fundo',
    'mediacao',
    'executivo',
    'comunidade',
    'ia',
    'perfil',
    'painel-empresa',
    'painel-conteudo',
    'painel-mediador',
  ],
}

export function canAccessPath(role: string, path: string): boolean {
  const r = (role || 'pessoa') as AppRole
  const allowed = ROLE_NAV[r] || ROLE_NAV.pessoa
  // path like /app/score or score
  const clean = path.replace(/^\/app\/?/, '').replace(/\/.*$/, '')
  return allowed.includes(clean)
}

export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return 'pessoa'
  if (role === 'user') return 'pessoa'
  if (APP_ROLES.includes(role as AppRole)) return role as AppRole
  return 'pessoa'
}
