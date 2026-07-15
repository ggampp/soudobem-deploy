import { Link } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Handshake,
  Heart,
  MessageCircle,
  Scale,
  Share2,
  Sparkles,
  Sprout,
  Trophy,
  Users,
} from 'lucide-react'
import {
  journeySteps,
  landingAssets,
  landingEcosystem,
  landingFaq,
  landingImpact,
  landingMarketplaceTags,
  landingMediationPoints,
  landingProblems,
  landingRegions,
  landingTestimonials,
} from '../data/seed'
import { PhoneScoreMock } from '../components/PhoneScoreMock'
import { Badge, Button, Logo } from '../components/ui'

const ecoIcons: Record<string, typeof Heart> = {
  Método: Sparkles,
  Score: Trophy,
  'Família do Bem': Heart,
  Marketplace: Handshake,
  'Fundo do Bem': Sprout,
  Mediação: Scale,
  'Franquia Executivo': Building2,
  Livro: BookOpen,
  Influenciadores: Users,
}

const navLinks = [
  { href: '#metodo', label: 'Método' },
  { href: '#ecossistema', label: 'Ecossistema' },
  { href: '#score', label: 'Score' },
  { href: '#numeros', label: 'Impacto' },
  { href: '#faq', label: 'Perguntas' },
]

export function Landing() {
  return (
    <div id="top" className="min-h-dvh soft-gradient">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:py-4">
          <a href="#top" className="shrink-0">
            <Logo />
          </a>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Seções">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground min-h-10 px-3 inline-flex items-center rounded-xl"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11 px-3 inline-flex items-center rounded-xl"
            >
              Entrar
            </Link>
            <Link to="/auth">
              <Button>Quero fazer parte</Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="conteudo">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:pt-14 animate-in">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="gold">Uma nova engenharia social</Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-balance leading-[1.1]">
                O mundo muda quando pessoas do Bem se unem.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty">
                Vivemos em uma sociedade onde a confiança diminui, os conflitos aumentam e boas pessoas
                acabam pagando pelas atitudes de poucos. A Sou do Bem nasceu para mudar essa realidade.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button className="px-6 min-h-12">Quero fazer parte</Button>
                </Link>
                <a href="#metodo">
                  <Button variant="outline" className="px-6 min-h-12">
                    Conheça o Método
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative">
              <img
                src={landingAssets.hero}
                alt="Mãos de pessoas diversas unidas em um gesto de confiança e cooperação"
                className="w-full rounded-[var(--radius-card)] object-cover aspect-[4/3] shadow-[var(--shadow-card)] border border-border"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Crença 95% */}
        <section className="border-y border-border bg-card/60">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
              Você acredita que a maioria das pessoas prefere viver em paz?
            </h2>
            <p className="mt-4 text-lg font-semibold text-primary-foreground/90">
              <span className="rounded-full bg-primary px-3 py-1">Nós também.</span>
            </p>
            <p className="mt-6 text-muted-foreground leading-relaxed text-pretty">
              Acreditamos que aproximadamente{' '}
              <strong className="text-foreground">95% das pessoas</strong> desejam viver em paz,
              prosperar e construir boas relações. O problema é que falta um ambiente que incentive esse
              comportamento.
            </p>
            <p className="mt-4 font-semibold">É exatamente isso que criamos.</p>
          </div>
        </section>

        {/* Alma / citação */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            A alma da plataforma
          </p>
          <blockquote className="mt-4 max-w-3xl text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-balance">
            “Ninguém modifica ninguém. Porém toda pessoa se modifica quando encontra um bom motivo e
            recebe a ajuda adequada.”
          </blockquote>
        </section>

        {/* Problema + Solução */}
        <section className="mx-auto max-w-6xl px-5 py-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <img
              src={landingAssets.problem}
              alt="Família se abraçando em momento emocional"
              className="w-full rounded-[var(--radius-card)] object-cover aspect-[4/3] shadow-[var(--shadow-card)] border border-border"
              loading="lazy"
            />
            <div className="space-y-10">
              <div>
                <Badge>O Problema</Badge>
                <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
                  Vivemos cercados de relações que poderiam ser muito melhores.
                </h2>
                <ul className="mt-6 space-y-3">
                  {landingProblems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm md:text-base">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge tone="gold">A Solução</Badge>
                <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
                  A Sou do Bem criou um novo jeito de viver.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
                  Nosso método transforma relações humanas em oportunidades de crescimento. Conectamos
                  pessoas, empresas, especialistas e tecnologia em um único ecossistema que incentiva o
                  bom comportamento e recompensa atitudes positivas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Jornada / Método */}
        <section id="metodo" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24" aria-labelledby="metodo-title">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Como funciona</p>
          <h2 id="metodo-title" className="mt-2 text-2xl font-extrabold md:text-3xl tracking-tight">
            Uma jornada feita de boas atitudes.
          </h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {journeySteps.map((step, i) => (
              <li key={step.title} className="card p-4 transition hover:shadow-[var(--shadow-card)]">
                <span
                  className="text-xs font-bold text-primary-foreground bg-primary w-8 h-8 rounded-full flex items-center justify-center tabular-nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-bold text-sm md:text-base">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-snug">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Score */}
        <section id="score" className="border-y border-border bg-card/50 scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="gold">Score do Bem</Badge>
              <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
                Reputação baseada em atitudes, não em curtidas.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                O Score representa comportamento observado ao longo das suas relações reais — construído
                com transparência e cuidado.
              </p>
              <div className="mt-8 flex flex-wrap gap-2" aria-label="Faixas do Score">
                {['0', '250', '500', '750', '1000'].map((n) => (
                  <span
                    key={n}
                    className="inline-flex min-w-[3.5rem] justify-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-bold tabular-nums"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <Link to="/auth" className="inline-block mt-8">
                <Button>Ver meu Score no app</Button>
              </Link>
            </div>
            <PhoneScoreMock />
          </div>
        </section>

        {/* IA */}
        <section id="ia" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge>IA Sou do Bem</Badge>
              <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
                Uma inteligência que entende o seu momento.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
                Nossa IA analisa o seu momento de vida e apresenta vídeos curtos, conteúdos e orientações
                produzidos por <strong className="text-foreground">especialistas certificados</strong> pela
                Sou do Bem para ajudá-lo a evoluir continuamente.
              </p>
              <Link to="/auth" className="inline-block mt-6">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4" /> Conversar no app
                </Button>
              </Link>
            </div>
            <div className="card p-5 space-y-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center font-extrabold text-sm">
                  SB
                </div>
                <div>
                  <p className="font-bold text-sm">IA Sou do Bem</p>
                  <p className="text-xs text-success font-semibold">● Online agora</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <p className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 leading-relaxed">
                  Olá! Notei que você esteve mais ocupado essa semana. Como está se sentindo?
                </p>
                <p className="rounded-2xl rounded-tr-sm bg-primary/25 px-4 py-3 leading-relaxed ml-8">
                  Cansado, sinceramente.
                </p>
                <p className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 leading-relaxed">
                  Separei 3 vídeos curtos de especialistas certificados que podem te ajudar a recuperar a
                  energia. Quer ver?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ecossistema */}
        <section id="ecossistema" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24" aria-labelledby="eco-title">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ecossistema</p>
          <h2 id="eco-title" className="mt-2 text-2xl font-extrabold md:text-3xl tracking-tight">
            Tudo conectado em torno de um único propósito.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landingEcosystem.map((item) => {
              const Icon = ecoIcons[item.title] || Heart
              return (
                <a
                  key={item.title}
                  href={item.href}
                  className="card p-5 transition hover:shadow-[var(--shadow-card)] hover:bg-accent/30 block"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground mb-3">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-foreground">Saiba mais</span>
                </a>
              )
            })}
          </div>
        </section>

        {/* Marketplace */}
        <section id="marketplace" className="border-y border-border bg-card/50 scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <Badge tone="gold">Marketplace do Bem</Badge>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance max-w-2xl">
              Consumir também pode ser um ato de cuidado.
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              Empresas certificadas, clientes do Bem e recompensas que retornam para quem age com
              integridade. Um marketplace que valoriza relações antes de transações.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Benefícios do marketplace">
              {landingMarketplaceTags.map((tag) => (
                <li key={tag}>
                  <span className="inline-flex rounded-full bg-background border border-border px-3.5 py-1.5 text-xs font-semibold">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/auth" className="inline-block mt-8">
              <Button>Explorar no app</Button>
            </Link>
          </div>
        </section>

        {/* Fundo do Bem */}
        <section id="fundo" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <img
              src={landingAssets.fund}
              alt="Família apoiada pelo Fundo do Bem"
              className="w-full rounded-[var(--radius-card)] object-cover aspect-[4/3] shadow-[var(--shadow-card)] border border-border"
              loading="lazy"
            />
            <div>
              <Badge>Fundo do Bem</Badge>
              <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance">
                Parte do que circula volta para a comunidade.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">
                Parte dos recursos movimentados dentro do ecossistema retorna para a comunidade por meio do
                Fundo do Bem, ajudando pessoas em momentos realmente importantes.
              </p>
              <Link to="/auth" className="inline-block mt-6">
                <Button variant="outline">Conhecer o Fundo</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mediação */}
        <section id="mediacao" className="border-y border-border bg-card/50 scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge>Mediação</Badge>
              <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight">
                Acordos antes de processos.
              </h2>
              <ul className="mt-6 space-y-3">
                {landingMediationPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                    <span className="text-sm md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src={landingAssets.mediation}
              alt="Aperto de mãos representando mediação"
              className="w-full rounded-[var(--radius-card)] object-cover aspect-[4/3] shadow-[var(--shadow-card)] border border-border"
              loading="lazy"
            />
          </div>
        </section>

        {/* Executivo / Franquia */}
        <section id="executivo" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24">
          <Badge tone="gold">Franquia Executivo do Bem</Badge>
          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl tracking-tight text-balance max-w-2xl">
            Lidere o movimento na sua região.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            Renda recorrente, expansão nacional e um propósito que vai muito além de um negócio.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3" aria-label="Regiões">
            {landingRegions.map((r) => (
              <li key={r}>
                <span className="inline-flex rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-bold shadow-sm">
                  {r}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/auth" className="inline-block mt-8">
            <Button>Candidate-se / Entrar</Button>
          </Link>
        </section>

        {/* Impacto */}
        <section id="numeros" className="border-y border-border bg-card/60 scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Impacto real</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl tracking-tight">
              Números que representam vidas.
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {landingImpact.map((item) => (
                <div key={item.label} className="card p-4 text-center sm:p-5">
                  <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium leading-snug">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="voices-title">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vozes da comunidade
          </p>
          <h2 id="voices-title" className="mt-2 text-2xl font-extrabold md:text-3xl tracking-tight">
            Quem vive, conta melhor.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {landingTestimonials.map((t) => (
              <figure key={t.name} className="card p-5 flex flex-col">
                <blockquote className="text-sm md:text-base leading-relaxed text-pretty flex-1">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-extrabold text-sm"
                    aria-hidden
                  >
                    {t.initial}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-5 py-14 scroll-mt-24" aria-labelledby="faq-title">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Perguntas frequentes
          </p>
          <h2 id="faq-title" className="mt-2 text-2xl font-extrabold tracking-tight">
            Tudo o que você precisa saber.
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Não encontrou sua dúvida? Fale com a nossa equipe.
          </p>
          <div className="mt-6 space-y-3">
            {landingFaq.map((item) => (
              <details key={item.q} className="card p-4 group">
                <summary className="cursor-pointer font-semibold list-none flex justify-between gap-4 items-center min-h-11">
                  {item.q}
                  <span
                    className="text-muted-foreground group-open:rotate-45 transition text-lg leading-none shrink-0"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section id="cta" className="mx-auto max-w-6xl px-5 py-16 text-center scroll-mt-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
            O futuro pertence às pessoas que escolhem fazer o Bem.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
            A Sou do Bem não é apenas um aplicativo. É um movimento. Uma comunidade. Um novo modelo de
            convivência humana.
          </p>
          <Link to="/auth" className="inline-block mt-8">
            <Button className="px-8 min-h-12">Quero fazer parte da revolução do Bem</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <Logo />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Uma nova engenharia social baseada em confiança, comportamento e cooperação.
              </p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Redes sociais">
                {['IG', 'YT', 'LK', 'TT'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold text-muted-foreground px-2"
                    title={label}
                  >
                    {label}
                  </span>
                ))}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground" aria-hidden>
                  <Share2 className="h-4 w-4" />
                </span>
              </div>
            </div>
            {(
              [
                ['Institucional', ['Sobre', 'Método', 'Manifesto', 'Imprensa']],
                ['Produtos', ['Score', 'IA', 'Marketplace', 'Mediação']],
                ['Empresas', ['Certificação', 'Cliente do Bem', 'Parcerias']],
                ['Franquias', ['Executivo do Bem', 'Modelo', 'Candidate-se']],
                ['Transparência', ['Fundo do Bem', 'Relatórios', 'LGPD', 'Termos']],
              ] as const
            ).map(([title, links]) => (
              <div key={title}>
                <p className="text-sm font-bold">{title}</p>
                <ul className="mt-3 space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <span className="text-sm text-muted-foreground">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
            <p>© 2026 Sou do Bem. Todos os direitos reservados.</p>
            <p>
              Conteúdo alinhado ao site oficial · versão local do app
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
