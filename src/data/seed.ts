import type {
  Benefit,
  Cause,
  CommunityEvent,
  CommunityPost,
  Company,
  DailyChallengeState,
  Influencer,
  LibraryItem,
  MethodPillar,
  Partner,
  TeamRow,
  UserProfile,
  UserSettings,
} from '../types'
import { withRecalculatedScore } from '../lib/score'

export const defaultMethod: MethodPillar[] = [
  {
    id: 'autoconhecimento',
    title: 'Autoconhecimento',
    description: 'Reconheça padrões, valores e limites pessoais.',
    practices: ['Diário de gratidão', 'Mapeamento de valores', 'Reflexão diária guiada'],
    progress: 12,
  },
  {
    id: 'empatia',
    title: 'Empatia',
    description: 'Cultive a capacidade de se colocar no lugar do outro.',
    practices: ['Escuta ativa', 'Perguntas abertas', 'Pausa antes de responder'],
    progress: 18,
  },
  {
    id: 'comunicacao',
    title: 'Comunicação consciente',
    description: 'Fale com clareza, ouça com presença, conecte com verdade.',
    practices: ['Comunicação não-violenta', 'Feedback honesto', 'Linguagem positiva'],
    progress: 10,
  },
  {
    id: 'etica',
    title: 'Ética e responsabilidade',
    description: 'Aja com integridade — combinados, palavra, presença.',
    practices: ['Cumprir combinados', 'Assumir erros', 'Coerência entre fala e ação'],
    progress: 15,
  },
  {
    id: 'contribuicao',
    title: 'Contribuição',
    description: 'Gere valor para pessoas, comunidades e causas.',
    practices: ['Pequenos gestos diários', 'Voluntariado', 'Mentoria'],
    progress: 8,
  },
]

export const companies: Company[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Verde Café Torrefação',
    initials: 'VC',
    category: 'Alimentação',
    seal: 'Ouro',
    score: 94,
    city: 'São Paulo',
    state: 'SP',
    description:
      'Cafés especiais de pequenos produtores, comércio justo e relação direta com agricultores familiares.',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Luz Cosméticos Naturais',
    initials: 'LC',
    category: 'Beleza & Bem-estar',
    seal: 'Ouro',
    score: 91,
    city: 'São Paulo',
    state: 'SP',
    description: 'Cosméticos veganos, cruelty-free, com cadeia de insumos rastreável.',
  },
  {
    id: 'db59fc37-0365-42e8-9dd9-89be8068ca77',
    name: 'Farmácia Cuidar+',
    initials: 'FC',
    category: 'Saúde',
    seal: 'Ouro',
    score: 84,
    city: 'São Paulo',
    state: 'SP',
    description: 'Rede farmacêutica com programa de medicamentos sociais.',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Obra Justa Construções',
    initials: 'OJ',
    category: 'Construção',
    seal: 'Prata',
    score: 82,
    city: 'São Paulo',
    state: 'SP',
    description: 'Construtora com contratos transparentes e obras entregues no prazo.',
  },
  {
    id: '40e78226-681d-432d-95e0-29eca66a84e9',
    name: 'Mercado Bairro Bom',
    initials: 'MB',
    category: 'Alimentação',
    seal: 'Ouro',
    score: 80,
    city: 'São Paulo',
    state: 'SP',
    description: 'Mercado que compra de pequenos produtores da região.',
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Papel do Bem',
    initials: 'PD',
    category: 'Papelaria',
    seal: 'Prata',
    score: 79,
    city: 'São Paulo',
    state: 'SP',
    description: 'Cada caderno vendido financia material escolar para crianças.',
  },
  {
    id: '1ea68fc2-e159-4734-bc1c-853ab2dcb2d4',
    name: 'EducaMais Escola',
    initials: 'EE',
    category: 'Educação',
    seal: 'Ouro',
    score: 78,
    city: 'São Paulo',
    state: 'SP',
    description: 'Escola com bolsas integrais para famílias vulneráveis.',
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'Raiz Moda Consciente',
    initials: 'RM',
    category: 'Moda',
    seal: 'Bronze',
    score: 71,
    city: 'São Paulo',
    state: 'SP',
    description:
      'Moda em pequenos lotes, com costureiras de cooperativas remuneradas com dignidade.',
  },
  {
    id: 'c97cb559-e0b5-4654-b87b-3ed9aaf92b73',
    name: 'Loja Verde Sustentável',
    initials: 'LV',
    category: 'Moda',
    seal: 'Prata',
    score: 70,
    city: 'São Paulo',
    state: 'SP',
    description: 'Moda circular com peças de segunda mão curadas.',
  },
  {
    id: '75912840-bf20-4b9c-a459-4d6ad2e20c69',
    name: 'Café Comunidade',
    initials: 'CC',
    category: 'Alimentação',
    seal: 'Prata',
    score: 66,
    city: 'São Paulo',
    state: 'SP',
    description: 'Cafeteria com espaço aberto para eventos comunitários.',
  },
  {
    id: '808b8b77-19dd-4304-8f17-e6ffbe21235e',
    name: 'Padaria Boa Vizinhança',
    initials: 'PB',
    category: 'Alimentação',
    seal: 'Prata',
    score: 62,
    city: 'São Paulo',
    state: 'SP',
    description: 'Padaria de bairro que doa sobras a instituições locais.',
  },
  {
    id: '6b73b0cb-ad93-45ae-9071-27200d5c9299',
    name: 'Oficina Reciclar',
    initials: 'OR',
    category: 'Construção',
    seal: 'Bronze',
    score: 55,
    city: 'São Paulo',
    state: 'SP',
    description: 'Materiais reaproveitados para pequenas reformas.',
  },
  {
    id: '8d6a8097-d462-4635-b34e-1fade1bf64e0',
    name: 'Studio Movimente',
    initials: 'SM',
    category: 'Beleza & Bem-estar',
    seal: 'Bronze',
    score: 48,
    city: 'São Paulo',
    state: 'SP',
    description: 'Estúdio de yoga que promove aulas gratuitas semanais.',
  },
]

export const benefits: Benefit[] = [
  {
    id: 'b1',
    title: 'Doe um kit escolar',
    companyId: '11111111-1111-1111-1111-111111111104',
    type: 'Doação',
    valueLabel: '1 kit para uma criança',
    cost: 150,
  },
  {
    id: 'b2',
    title: '20% off em toda linha facial',
    companyId: '11111111-1111-1111-1111-111111111102',
    type: 'Produto',
    valueLabel: '20% off',
    cost: 220,
    featured: true,
  },
  {
    id: 'b3',
    title: 'Cashback ampliado na próxima compra',
    companyId: '11111111-1111-1111-1111-111111111105',
    type: 'Cashback',
    valueLabel: '+10% cashback',
    cost: 300,
  },
  {
    id: 'b4',
    title: 'Kit degustação de cafés especiais',
    companyId: '11111111-1111-1111-1111-111111111101',
    type: 'Experiência',
    valueLabel: 'R$ 120 em produtos',
    cost: 480,
    featured: true,
  },
  {
    id: 'b5',
    title: '1h de consultoria de reforma consciente',
    companyId: '11111111-1111-1111-1111-111111111103',
    type: 'Serviço',
    valueLabel: 'R$ 350 em serviço',
    cost: 600,
  },
  {
    id: 'b6',
    title: 'Aula experimental de yoga',
    companyId: '8d6a8097-d462-4635-b34e-1fade1bf64e0',
    type: 'Experiência',
    valueLabel: '1 aula avulsa',
    cost: 80,
  },
]

export const influencers: Influencer[] = [
  {
    id: 'bc0322b5-d8ee-4be1-a419-57a727871219',
    name: 'Marina Silva',
    handle: '@marinaverde',
    niche: 'Sustentabilidade',
    bio: 'Comunica práticas regenerativas e consumo consciente com lastro e dados.',
    score: 92,
    reach: '184.0K',
    engagement: '5.8%',
    verified: true,
  },
  {
    id: '5ecd265d-d462-4c3b-8cc4-ac50cb70495d',
    name: 'Júlia Rocha',
    handle: '@juliarocha',
    niche: 'Saúde mental',
    bio: 'Conversas honestas sobre cuidado emocional, terapia e relações.',
    score: 90,
    reach: '221.0K',
    engagement: '6.1%',
    verified: true,
  },
  {
    id: '4d0fb14a-ee69-4ada-8395-b8ae86e43e41',
    name: 'Caio Mendes',
    handle: '@caiocoletivo',
    niche: 'Economia colaborativa',
    bio: 'Conecta comunidades, cooperativas e iniciativas de impacto social.',
    score: 88,
    reach: '96.5K',
    engagement: '7.2%',
    verified: true,
  },
  {
    id: 'f1bc1c2b-91d8-4f2f-ba1c-a6d5346030dc',
    name: 'Lia Nunes',
    handle: '@lianunes',
    niche: 'Educação',
    bio: 'Educadora que traduz ciência e cidadania para o cotidiano das famílias.',
    score: 86,
    reach: '132.4K',
    engagement: '8.4%',
    verified: true,
  },
  {
    id: '1fadff46-9015-479d-b85b-00bbb91e5347',
    name: 'Bruno Tavares',
    handle: '@brunoetica',
    niche: 'Ética & Tecnologia',
    bio: 'Discute o impacto humano das decisões de IA, dados e plataformas.',
    score: 84,
    reach: '58.3K',
    engagement: '4.9%',
    verified: false,
    rising: true,
  },
]

export const causes: Cause[] = [
  {
    id: 'c1',
    title: 'Educação para todos',
    description: 'Bolsas e materiais para crianças em situação de vulnerabilidade em escolas públicas.',
    raised: 32000,
    goal: 50000,
  },
  {
    id: 'c2',
    title: 'Alimento que abraça',
    description: 'Cestas básicas e refeições quentes distribuídas em comunidades urbanas.',
    raised: 24500,
    goal: 30000,
  },
  {
    id: 'c3',
    title: 'Reflorestar é cuidar',
    description: 'Plantio de árvores nativas em áreas degradadas da Mata Atlântica.',
    raised: 18000,
    goal: 80000,
  },
  {
    id: 'c4',
    title: 'Saúde mental acessível',
    description: 'Atendimento psicológico gratuito para jovens em risco social.',
    raised: 9500,
    goal: 40000,
  },
]

export const partners: Partner[] = [
  {
    id: 'p1',
    name: 'Farmácia Cuidar+',
    category: 'Saúde',
    discount: '8% em genéricos',
    heartsRequired: 3,
    active: true,
    address: 'Rua das Flores, 120 — SP',
    companyId: 'db59fc37-0365-42e8-9dd9-89be8068ca77',
  },
  {
    id: 'p2',
    name: 'Verde Café Torrefação',
    category: 'Alimentação',
    discount: '10% no balcão',
    heartsRequired: 2,
    active: true,
    address: 'Al. Santos, 890 — SP',
    companyId: '11111111-1111-1111-1111-111111111101',
  },
  {
    id: 'p3',
    name: 'Studio Movimente',
    category: 'Bem-estar',
    discount: '1ª aula grátis',
    heartsRequired: 1,
    active: true,
    address: 'Rua Augusta, 450 — SP',
    companyId: '8d6a8097-d462-4635-b34e-1fade1bf64e0',
  },
  {
    id: 'p4',
    name: 'Raiz Moda Consciente',
    category: 'Moda',
    discount: '15% em peças selecionadas',
    heartsRequired: 5,
    active: true,
    address: 'Pinheiros — SP',
    companyId: '11111111-1111-1111-1111-111111111105',
  },
  {
    id: 'p5',
    name: 'Obra Justa Construções',
    category: 'Construção',
    discount: 'Consultoria inicial sem custo',
    heartsRequired: 8,
    active: false,
    companyId: '11111111-1111-1111-1111-111111111103',
  },
]

export const executiveTeams: TeamRow[] = [
  { name: 'Produto', people: 28, score: 89, risk: 'baixo' },
  { name: 'Comercial', people: 34, score: 81, risk: 'médio' },
  { name: 'Operações', people: 42, score: 78, risk: 'médio' },
  { name: 'Atendimento', people: 22, score: 86, risk: 'baixo' },
  { name: 'Financeiro', people: 16, score: 74, risk: 'alto' },
]

export const scoreHistory = [
  { month: 'jan', score: 60 },
  { month: 'fev', score: 62 },
  { month: 'mar', score: 64 },
  { month: 'abr', score: 65 },
  { month: 'mai', score: 67 },
  { month: 'jun', score: 68 },
  { month: 'jul', score: 70 },
]

export const orgScoreHistory = [
  { month: 'Jan', score: 76, conflicts: 12 },
  { month: 'Fev', score: 78, conflicts: 11 },
  { month: 'Mar', score: 79, conflicts: 10 },
  { month: 'Abr', score: 80, conflicts: 9 },
  { month: 'Mai', score: 82, conflicts: 8 },
  { month: 'Jun', score: 83, conflicts: 7 },
  { month: 'Jul', score: 84, conflicts: 6 },
]

export const defaultChallenge: DailyChallengeState = {
  id: 'challenge-escuta',
  title: 'Pratique a escuta ativa hoje',
  description:
    'Em sua próxima conversa, ouça por 2 minutos sem interromper. Depois resuma o que entendeu. Marque progresso cada vez que praticar.',
  progress: 0,
  target: 3,
  rewardGc: 25,
  completed: false,
  accepted: false,
  daysLeft: 3,
  dimension: 'empatia',
  pillarId: 'empatia',
}

export const communitySeedPosts: CommunityPost[] = [
  {
    id: 'post-1',
    type: 'conquista',
    author: 'Mariana S.',
    title: '30 dias de escuta ativa',
    body: 'Completei um mês praticando 2 minutos de escuta sem interromper. Minha filha notou a diferença.',
    likes: 48,
    createdAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
    tags: ['empatia', 'família'],
  },
  {
    id: 'post-2',
    type: 'historia',
    author: 'Rodrigo M.',
    title: 'Mediação que evitou um processo',
    body: 'Dois sócios estavam a um e-mail de romper. Usamos o fluxo de mediação e saímos com 3 combinados claros.',
    likes: 72,
    createdAt: new Date(Date.now() - 3600_000 * 20).toISOString(),
    tags: ['mediação', 'trabalho'],
  },
  {
    id: 'post-3',
    type: 'projeto',
    author: 'Padaria Aurora',
    title: 'Selo Ouro renovado',
    body: 'Nossa equipe celebrou a renovação do selo. Clientes voltaram com outra energia — orgulho coletivo.',
    likes: 91,
    createdAt: new Date(Date.now() - 3600_000 * 30).toISOString(),
    tags: ['empresas', 'selo'],
  },
  {
    id: 'post-4',
    type: 'dica',
    author: 'IA do Bem',
    title: 'Micro-hábito da semana',
    body: 'Antes de responder uma mensagem difícil, respire 3 vezes e escreva o pedido em uma frase clara.',
    likes: 120,
    createdAt: new Date(Date.now() - 3600_000 * 8).toISOString(),
    tags: ['método', 'comunicação'],
  },
]

export const communityEvents: CommunityEvent[] = [
  {
    id: 'ev-1',
    title: 'Roda de escuta no Café Comunidade',
    date: new Date(Date.now() + 86400_000 * 4).toISOString(),
    location: 'Café Comunidade — SP',
    description: 'Encontro presencial de 90 min para praticar escuta ativa em pares.',
    attendees: 18,
  },
  {
    id: 'ev-2',
    title: 'Workshop online: Feedback do Bem',
    date: new Date(Date.now() + 86400_000 * 10).toISOString(),
    location: 'Online',
    description: 'Como dar e receber feedback sem destruir a relação.',
    attendees: 64,
  },
  {
    id: 'ev-3',
    title: 'Mutirão Fundo do Bem — kits escolares',
    date: new Date(Date.now() + 86400_000 * 15).toISOString(),
    location: 'Zona Leste — SP',
    description: 'Montagem e entrega de kits com empresas parceiras.',
    attendees: 41,
  },
]

export const libraryItems: LibraryItem[] = [
  {
    id: 'lib-1',
    title: 'Escuta ativa em 6 minutos',
    kind: 'vídeo',
    minutes: 6,
    pillar: 'empatia',
    summary: 'Passo a passo para ouvir sem preparar a resposta.',
  },
  {
    id: 'lib-2',
    title: 'Mapa de valores pessoais',
    kind: 'prática',
    minutes: 15,
    pillar: 'autoconhecimento',
    summary: 'Exercício guiado para listar e priorizar valores.',
  },
  {
    id: 'lib-3',
    title: 'Pedidos claros vs. cobranças',
    kind: 'artigo',
    minutes: 8,
    pillar: 'comunicacao',
    summary: 'Linguagem que reduz atrito e aumenta cooperação.',
  },
  {
    id: 'lib-4',
    title: 'Áudio: 3 minutos de presença',
    kind: 'áudio',
    minutes: 3,
    pillar: 'autoconhecimento',
    summary: 'Respiração e ancoragem antes de conversas difíceis.',
  },
  {
    id: 'lib-5',
    title: 'Ética no cotidiano digital',
    kind: 'artigo',
    minutes: 10,
    pillar: 'etica',
    summary: 'Combinados, prazos e transparência em times remotos.',
  },
]

export const defaultSettings: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  showScorePublicly: false,
  allowRelationInvites: true,
  theme: 'light',
  language: 'pt-BR',
}

/** Conteúdo espelhado do site oficial (soudobemsite.testecliente.com.br) */
export const landingFaq = [
  {
    q: 'O que é a Sou do Bem?',
    a: 'É uma plataforma e um movimento que conecta pessoas, empresas e especialistas em torno de boas atitudes, com tecnologia para apoiar a evolução de cada um.',
  },
  {
    q: 'Como funciona na prática?',
    a: 'Você se cadastra, constrói relações reais, recebe e dá avaliações, evolui seu Score e acessa recompensas e conteúdos personalizados pela IA.',
  },
  {
    q: 'É gratuito?',
    a: 'Sim, a participação na comunidade é gratuita. Existem planos e produtos para quem deseja se aprofundar ou empreender dentro do ecossistema.',
  },
  {
    q: 'Como ganho recompensas?',
    a: 'Por meio de boas atitudes, consumo consciente no marketplace e participação ativa no ecossistema.',
  },
  {
    q: 'Como funciona o Score?',
    a: 'O Score reflete o seu comportamento ao longo das relações, com transparência e cuidado com a privacidade.',
  },
  {
    q: 'Quem pode participar?',
    a: 'Qualquer pessoa, família, empresa ou comunidade que deseje viver relações mais saudáveis.',
  },
  {
    q: 'Como funciona o Fundo do Bem?',
    a: 'Parte dos recursos movimentados no ecossistema é destinada a apoiar pessoas em momentos críticos.',
  },
  {
    q: 'Como funciona a IA Sou do Bem?',
    a: 'Ela analisa o seu momento e sugere conteúdos curtos e orientações de especialistas certificados.',
  },
]

export const journeySteps = [
  { title: 'Cadastro', description: 'Crie seu perfil em minutos' },
  { title: 'Relacionamentos', description: 'Conecte pessoas e empresas' },
  { title: 'Avaliações', description: 'Trocas honestas e construtivas' },
  { title: 'Score de Atitudes', description: 'Comportamento observável' },
  { title: 'IA personalizada', description: 'Orientação no seu momento' },
  { title: 'Transformação', description: 'Pequenos passos, grandes mudanças' },
  { title: 'Recompensas', description: 'Cashback, benefícios, prestígio' },
  { title: 'Comunidade', description: 'Você não caminha sozinho' },
]

export const landingProblems = [
  'Já fomos enganados',
  'Sofremos perdas financeiras',
  'Confiamos na pessoa errada',
  'Enfrentamos conflitos familiares',
  'Tivemos problemas profissionais',
]

export const landingEcosystem = [
  { title: 'Método', description: 'A base filosófica que orienta tudo.', href: '#metodo' },
  { title: 'Score', description: 'Reputação por atitudes reais.', href: '#score' },
  { title: 'Família do Bem', description: 'Conexões que cuidam.', href: '#ecossistema' },
  { title: 'Marketplace', description: 'Consumo que recompensa.', href: '#marketplace' },
  { title: 'Fundo do Bem', description: 'Recursos que voltam à comunidade.', href: '#fundo' },
  { title: 'Mediação', description: 'Conflitos resolvidos com humanidade.', href: '#mediacao' },
  { title: 'Franquia Executivo', description: 'Expansão nacional do movimento.', href: '#executivo' },
  { title: 'Livro', description: 'A filosofia em palavras.', href: '#ecossistema' },
  { title: 'Influenciadores', description: 'Vozes que amplificam o Bem.', href: '#ecossistema' },
]

export const landingMediationPoints = [
  'Resolver conflitos com humanidade',
  'Economizar tempo e dinheiro',
  'Evitar processos desgastantes',
  'Reconstruir relações',
]

export const landingRegions = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

export const landingMarketplaceTags = [
  'Cashback',
  'Benefícios',
  'Cliente do Bem',
  'Empresa Certificada',
  'Recompensas',
]

export const landingImpact = [
  { value: '12k+', label: 'Usuários ativos' },
  { value: '480+', label: 'Empresas certificadas' },
  { value: '3.2k+', label: 'Clientes do Bem' },
  { value: '890+', label: 'Mediações realizadas' },
  { value: 'R$ 4,2M', label: 'Reais movimentados' },
  { value: '320+', label: 'Famílias ajudadas' },
  { value: '742', label: 'Score médio' },
  { value: '68%', label: 'Tempo economizado' },
]

export const landingTestimonials = [
  {
    quote: 'Encontrei um lugar onde minhas atitudes valem algo. Mudou como olho para as pessoas.',
    name: 'Mariana S.',
    role: 'Mãe e empreendedora',
    initial: 'M',
  },
  {
    quote: 'Não é só um negócio. É um propósito que faz sentido todos os dias.',
    name: 'Rodrigo M.',
    role: 'Executivo do Bem',
    initial: 'R',
  },
  {
    quote: 'Nossos clientes voltaram com outra energia. O selo virou orgulho do nosso time.',
    name: 'Padaria Aurora',
    role: 'Empresa certificada',
    initial: 'P',
  },
  {
    quote: 'Em um momento muito difícil, a comunidade nos abraçou. Nunca vou esquecer.',
    name: 'Família Lopes',
    role: 'Apoiada pelo Fundo',
    initial: 'F',
  },
]

/** Assets do site de staging (fotos). Score no celular é UI em PhoneScoreMock. */
export const landingAssets = {
  hero: 'https://soudobemsite.testecliente.com.br/assets/hero-people-DlOEU_ep.jpg',
  problem: 'https://soudobemsite.testecliente.com.br/assets/problem-family-gmo9LLz3.jpg',
  fund: 'https://soudobemsite.testecliente.com.br/assets/fund-family-Cowfdw67.jpg',
  mediation: 'https://soudobemsite.testecliente.com.br/assets/mediation-GhnvRA2p.jpg',
  logo: 'https://soudobemsite.testecliente.com.br/__l5e/assets-v1/8b0967ee-959a-47ad-827e-6308b3d74cee/sou-do-bem-logo.png',
}

export function createDefaultUser(overrides?: Partial<UserProfile>): UserProfile {
  const base: UserProfile = {
    name: 'Guilherme Pimentel',
    email: 'ggampp@gmail.com',
    role: 'pessoa',
    onboarded: true,
    bio: 'Construindo relações mais saudáveis e um ecossistema de confiança.',
    city: 'São Paulo, SP',
    score: 70,
    dimensions: {
      confianca: 70,
      empatia: 70,
      etica: 70,
      cooperacao: 70,
      responsabilidade: 70,
    },
    streakDays: 12,
    goodcoins: 500,
    hearts: 0,
    achievements: [
      'Coração de Ouro — 30 dias consecutivos no método',
      'Mediador do Bem — 5 mediações concluídas com sucesso',
      'Voz Empática — Top 10% em escuta ativa este mês',
    ],
    seal: 'Confiável',
    method: defaultMethod.map((p) => ({ ...p })),
    relations: [],
    mediations: [],
    goodcoinLedger: [
      {
        id: 'tx-welcome',
        label: 'Bônus de boas-vindas',
        date: '14 de jul.',
        amount: 500,
      },
    ],
    redeemedBenefitIds: [],
    chat: [
      {
        role: 'assistant',
        text: 'Olá! Sou a IA do Bem 💛 Estou aqui para te ajudar a evoluir nas suas relações, no método e no seu Score do Bem. Por onde quer começar?',
        createdAt: new Date().toISOString(),
      },
    ],
    favoriteCompanyIds: [],
    favoritePartnerIds: [],
    followingInfluencerIds: [],
    companyReviews: [],
    communityPosts: [],
    likedPostIds: [],
    joinedEventIds: [],
    completedLibraryIds: [],
    notifications: [
      {
        id: 'n1',
        type: 'system',
        title: 'Bem-vindo ao Sou do Bem',
        body: 'Explore o Método, cadastre uma relação e aceite o desafio do dia.',
        createdAt: new Date().toISOString(),
        read: false,
        href: '/app',
      },
      {
        id: 'n2',
        type: 'marketplace',
        title: '+500 GoodCoins',
        body: 'Bônus de boas-vindas creditado no seu saldo.',
        createdAt: new Date().toISOString(),
        read: false,
        href: '/app/beneficios',
      },
    ],
    challenge: { ...defaultChallenge },
    settings: { ...defaultSettings },
    causeContributions: {},
    ...overrides,
  }
  return withRecalculatedScore(base)
}
