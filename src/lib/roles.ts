export type AppRole = 'pessoa' | 'empresa' | 'influenciador' | 'executivo' | 'mediador' | 'admin'

export const ROLE_OPTIONS: {
  id: Exclude<AppRole, 'admin'>
  label: string
  tagline: string
  description: string
  needsTenant: boolean
}[] = [
  {
    id: 'pessoa',
    label: 'Pessoa',
    tagline: 'Quero evoluir minhas relações.',
    description:
      'Score do Bem, Método, círculo de relações, desafios e marketplace como consumidor do bem.',
    needsTenant: false,
  },
  {
    id: 'empresa',
    label: 'Empresa',
    tagline: 'Quero certificar meu negócio.',
    description: 'Cadastro, certificação, benefícios e reputação da sua empresa no território.',
    needsTenant: false,
  },
  {
    id: 'influenciador',
    label: 'Influenciador',
    tagline: 'Quero criar conteúdo do bem.',
    description: 'Perfil público, publicações e engajamento com propósito na comunidade.',
    needsTenant: false,
  },
  {
    id: 'executivo',
    label: 'Líder / Executivo',
    tagline: 'Quero atuar no território.',
    description: 'Painel multi-tenant regional: pessoas, empresas, mediações e comunidade.',
    needsTenant: true,
  },
  {
    id: 'mediador',
    label: 'Mediador',
    tagline: 'Quero ajudar a resolver conflitos.',
    description: 'Fila de mediações do território e condução de acordos humanizados.',
    needsTenant: true,
  },
]

/**
 * Menu por perfil — só o que aquele perfil enxerga.
 * Ações de cadastro são ainda filtradas por permissions.ts.
 */
export const ROLE_NAV: Record<AppRole, { to: string; label: string; end?: boolean }[]> = {
  pessoa: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/metodo', label: 'Método' },
    { to: '/app/score', label: 'Score' },
    { to: '/app/relacoes', label: 'Relações' },
    { to: '/app/empresas', label: 'Empresas' },
    { to: '/app/beneficios', label: 'Marketplace' },
    { to: '/app/parceiros', label: 'Parceiros' },
    { to: '/app/mediacao', label: 'Mediação' },
    { to: '/app/comunidade', label: 'Comunidade' },
    { to: '/app/fundo', label: 'Fundo' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
  empresa: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/painel-empresa', label: 'Meu negócio' },
    { to: '/app/empresas', label: 'Minha empresa' },
    { to: '/app/beneficios', label: 'Marketplace' },
    { to: '/app/parceiros', label: 'Parceiros' },
    { to: '/app/score', label: 'Score' },
    { to: '/app/comunidade', label: 'Comunidade' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
  influenciador: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/painel-conteudo', label: 'Conteúdo' },
    { to: '/app/comunidade', label: 'Comunidade' },
    { to: '/app/influenciadores', label: 'Influenciadores' },
    { to: '/app/score', label: 'Score' },
    { to: '/app/metodo', label: 'Método' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
  executivo: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/executivo', label: 'Território' },
    { to: '/app/empresas', label: 'Empresas' },
    { to: '/app/parceiros', label: 'Parceiros' },
    { to: '/app/mediacao', label: 'Mediações' },
    { to: '/app/comunidade', label: 'Comunidade' },
    { to: '/app/fundo', label: 'Fundo' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
  mediador: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/painel-mediador', label: 'Fila' },
    { to: '/app/mediacao', label: 'Mediações' },
    { to: '/app/score', label: 'Score' },
    { to: '/app/metodo', label: 'Método' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
  admin: [
    { to: '/app', label: 'Início', end: true },
    { to: '/app/executivo', label: 'Território' },
    { to: '/app/painel-mediador', label: 'Mediação' },
    { to: '/app/painel-empresa', label: 'Empresas' },
    { to: '/app/relacoes', label: 'Relações' },
    { to: '/app/empresas', label: 'Catálogo empresas' },
    { to: '/app/beneficios', label: 'Marketplace' },
    { to: '/app/score', label: 'Score' },
    { to: '/app/ia', label: 'Conversar com a IA' },
    { to: '/app/perfil', label: 'Perfil' },
  ],
}

export function normalizeRole(role?: string | null): AppRole {
  if (!role || role === 'user') return 'pessoa'
  if (role in ROLE_NAV) return role as AppRole
  return 'pessoa'
}
