import { benefits, companies, communityEvents, communitySeedPosts, influencers, libraryItems, partners } from '../data/seed'
import type { UserProfile } from '../types'

export type SearchHit = {
  id: string
  kind: string
  title: string
  subtitle?: string
  href: string
}

export function globalSearch(query: string, user: UserProfile | null): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return []

  const hits: SearchHit[] = []

  for (const c of companies) {
    if (`${c.name} ${c.category} ${c.description}`.toLowerCase().includes(q)) {
      hits.push({
        id: c.id,
        kind: 'Empresa',
        title: c.name,
        subtitle: `${c.category} · Score ${c.score}`,
        href: `/app/empresas/${c.id}`,
      })
    }
  }

  for (const i of influencers) {
    if (`${i.name} ${i.handle} ${i.niche} ${i.bio}`.toLowerCase().includes(q)) {
      hits.push({
        id: i.id,
        kind: 'Influenciador',
        title: i.name,
        subtitle: `${i.handle} · ${i.niche}`,
        href: `/app/influenciadores/${i.id}`,
      })
    }
  }

  for (const b of benefits) {
    if (b.title.toLowerCase().includes(q)) {
      hits.push({
        id: b.id,
        kind: 'Benefício',
        title: b.title,
        subtitle: `${b.cost} GC`,
        href: '/app/beneficios',
      })
    }
  }

  for (const p of partners) {
    if (`${p.name} ${p.category}`.toLowerCase().includes(q)) {
      hits.push({
        id: p.id,
        kind: 'Parceiro',
        title: p.name,
        subtitle: p.discount,
        href: '/app/parceiros',
      })
    }
  }

  for (const post of [...(user?.communityPosts || []), ...communitySeedPosts]) {
    if (`${post.title} ${post.body} ${post.author}`.toLowerCase().includes(q)) {
      hits.push({
        id: post.id,
        kind: 'Comunidade',
        title: post.title,
        subtitle: post.author,
        href: '/app/comunidade',
      })
    }
  }

  for (const ev of communityEvents) {
    if (`${ev.title} ${ev.description}`.toLowerCase().includes(q)) {
      hits.push({
        id: ev.id,
        kind: 'Evento',
        title: ev.title,
        subtitle: ev.location,
        href: '/app/comunidade',
      })
    }
  }

  for (const lib of libraryItems) {
    if (`${lib.title} ${lib.summary}`.toLowerCase().includes(q)) {
      hits.push({
        id: lib.id,
        kind: 'Biblioteca',
        title: lib.title,
        subtitle: lib.kind,
        href: '/app/comunidade',
      })
    }
  }

  if (user) {
    for (const r of user.relations) {
      if (r.name.toLowerCase().includes(q)) {
        hits.push({
          id: r.id,
          kind: 'Relação',
          title: r.name,
          subtitle: r.category,
          href: '/app/relacoes',
        })
      }
    }
  }

  const routes = [
    { title: 'Método', href: '/app/metodo', keys: 'método metodo pilares' },
    { title: 'Score do Bem', href: '/app/score', keys: 'score reputação' },
    { title: 'Mediação', href: '/app/mediacao', keys: 'mediação conflito' },
    { title: 'Fundo do Bem', href: '/app/fundo', keys: 'fundo causa doação' },
    { title: 'IA do Bem', href: '/app/ia', keys: 'ia inteligência chat' },
    { title: 'Executivo', href: '/app/executivo', keys: 'executivo painel organização' },
  ]
  for (const r of routes) {
    if (`${r.title} ${r.keys}`.toLowerCase().includes(q)) {
      hits.push({ id: r.href, kind: 'Módulo', title: r.title, href: r.href })
    }
  }

  return hits.slice(0, 20)
}
