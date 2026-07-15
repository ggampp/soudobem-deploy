import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import {
  benefits as seedBenefits,
  causes as seedCauses,
  communityEvents as seedEvents,
  communitySeedPosts,
  companies as seedCompanies,
  influencers as seedInfluencers,
  libraryItems as seedLibrary,
  partners as seedPartners,
} from '../data/seed'
import type {
  Benefit,
  Cause,
  CommunityEvent,
  CommunityPost,
  Company,
  Influencer,
  LibraryItem,
  Partner,
} from '../types'

type Catalog = {
  companies: Company[]
  benefits: Benefit[]
  influencers: Influencer[]
  partners: Partner[]
  causes: Cause[]
  posts: CommunityPost[]
  events: CommunityEvent[]
  library: LibraryItem[]
  fromApi: boolean
  reload: () => Promise<void>
}

const CatalogContext = createContext<Catalog | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Catalog, 'reload'>>({
    companies: seedCompanies,
    benefits: seedBenefits,
    influencers: seedInfluencers,
    partners: seedPartners,
    causes: seedCauses,
    posts: communitySeedPosts,
    events: seedEvents,
    library: seedLibrary,
    fromApi: false,
  })

  const reload = async () => {
    try {
      const [c, b, i, p, ca, com] = await Promise.all([
        api.catalogCompanies(),
        api.catalogBenefits(),
        api.catalogInfluencers(),
        api.catalogPartners(),
        api.catalogCauses(),
        api.catalogCommunity(),
      ])
      setState({
        companies: c.companies as Company[],
        benefits: b.benefits as Benefit[],
        influencers: i.influencers as Influencer[],
        partners: p.partners as Partner[],
        causes: ca.causes as Cause[],
        posts: com.posts as CommunityPost[],
        events: com.events as CommunityEvent[],
        library: com.library as LibraryItem[],
        fromApi: true,
      })
    } catch {
      // keep seed fallback
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <CatalogContext.Provider value={{ ...state, reload }}>{children}</CatalogContext.Provider>
  )
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
