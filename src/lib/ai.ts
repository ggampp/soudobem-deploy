import type { UserProfile } from '../types'
import { avgDimensions, methodAverage, relationsAverage } from './score'

function lowestPillar(user: UserProfile) {
  return [...user.method].sort((a, b) => a.progress - b.progress)[0]
}

function lowestDimension(user: UserProfile) {
  const entries = Object.entries(user.dimensions) as [string, number][]
  return entries.sort((a, b) => a[1] - b[1])[0]
}

export function buildAiReply(prompt: string, user: UserProfile): string {
  const lower = prompt.toLowerCase()
  const lowPillar = lowestPillar(user)
  const [lowDim, lowDimVal] = lowestDimension(user)
  const relAvg = relationsAverage(user.relations)
  const methodAvg = methodAverage(user.method)
  const score = user.score

  if (lower.includes('plano') || lower.includes('7 dias')) {
    const focus = lower.includes('comunicação') || lower.includes('comunicacao')
      ? 'Comunicação consciente'
      : lowPillar?.title || 'Empatia'
    return [
      `Plano de 7 dias focado em **${focus}** (Score atual ${score}):`,
      'D1 — Diagnóstico: anote 3 situações reais da semana.',
      'D2 — Escuta de 2 min sem interromper.',
      'D3 — Um feedback honesto e gentil.',
      'D4 — Cumprir um combinado pequeno no prazo.',
      'D5 — Ato de contribuição (ajuda concreta).',
      'D6 — Revisar o Método e subir o slider com honestidade.',
      'D7 — Avaliar uma relação e conversar comigo sobre aprendizados.',
      `Pilar mais baixo hoje: ${lowPillar?.title ?? '—'} (${lowPillar?.progress ?? 0}%).`,
    ].join('\n')
  }

  if (lower.includes('empatia') || lowDim === 'empatia' && lower.includes('melhorar')) {
    return `Empatia em ${user.dimensions.empatia}/100. Esta semana: (1) escuta ativa 2 min; (2) uma pergunta aberta por conversa; (3) resumo do que ouviu. Aceite o desafio do dia e registre no Método → Empatia.`
  }

  if (lower.includes('escuta')) {
    return 'Exercício de escuta ativa: peça 5 minutos a alguém do seu círculo, só faça perguntas de clarificação e feche com “O que entendi é…”. Marque progresso no desafio do dia e no pilar Empatia.'
  }

  if (lower.includes('amigo') || lower.includes('contato') || lower.includes('relação') || lower.includes('relacao')) {
    if (!user.relations.length) {
      return 'Você ainda não tem relações cadastradas. Vá em Relações → Nova relação e adicione alguém real. Depois faça uma avaliação honesta nas 5 dimensões — isso alimenta seu Score.'
    }
    const names = user.relations
      .slice(0, 3)
      .map((r) => r.name)
      .join(', ')
    return `Suas relações: ${names}${user.relations.length > 3 ? '…' : ''}. Média do círculo: ${relAvg ?? '—'}. Para retomar contato: mensagem curta sem cobrança + oferta leve. Se houver tensão, abra uma Mediação estruturada.`
  }

  if (lower.includes('score') || lower.includes('reputação') || lower.includes('reputacao')) {
    return `Seu Score do Bem é ${score} (selo ${user.seal}). Composição aproximada: dimensões ${avgDimensions(user.dimensions)}, método ${methodAvg}%, relações ${relAvg ?? 'sem dados'}. Dimensão mais frágil: ${lowDim} (${lowDimVal}).`
  }

  if (lower.includes('goodcoin') || lower.includes('recompensa') || lower.includes('marketplace')) {
    return `Saldo: ${user.goodcoins} GoodCoins (≈ R$ ${(user.goodcoins / 10).toFixed(2)}). Ganhe com desafios, avaliações, mediações resolvidas e progresso no Método. Resgate no Marketplace com empresas certificadas.`
  }

  if (lower.includes('media') || lower.includes('conflito') || lower.includes('briga')) {
    return 'Mediação: descreva o fato (sem julgar), o impacto em você e o pedido claro. No app, abra Mediação, avance com a IA e registre o acordo. Mediações resolvidas sobem Ética e Responsabilidade.'
  }

  if (lower.includes('fundo') || lower.includes('doar') || lower.includes('causa')) {
    return 'No Fundo do Bem você apoia causas com GoodCoins. Parte do ecossistema volta para impacto verificável. Comece com 50 GC em uma causa alinhada aos seus valores.'
  }

  if (lower.includes('empresa') || lower.includes('parceiro')) {
    return 'Empresas certificadas têm Score e selo (Ouro/Prata/Bronze). Avalie com honestidade e use o Marketplace. Parceiros ativos desbloqueiam descontos conforme seus corações (gestos no app).'
  }

  if (lower.includes('olá') || lower.includes('ola') || lower.includes('oi') || lower.includes('bom dia')) {
    return `Olá, ${user.name.split(' ')[0]}! Score ${score}, sequência de ${user.streakDays} dias. Pilar a fortalecer: ${lowPillar?.title}. Quer um plano de 7 dias ou um exercício de escuta?`
  }

  return [
    `Sobre “${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}”:`,
    `Seu contexto — Score ${score}, método ${methodAvg}%, círculo ${user.relations.length} relação(ões), GC ${user.goodcoins}.`,
    `Sugestão: evolua **${lowPillar?.title ?? 'Empatia'}** e a dimensão **${lowDim}** (${lowDimVal}).`,
    'Caminhos: desafio do dia · avaliar uma relação · 10 min no Método · ou pedir um plano de 7 dias.',
  ].join(' ')
}

export function mediationAiStep(step: number, mediationTitle: string, withWhom: string): string {
  const steps = [
    `Vamos estruturar a mediação “${mediationTitle}” com ${withWhom}. Passo 1: descreva só os fatos observáveis (sem adjetivos pejorativos).`,
    'Passo 2: diga qual necessidade ou valor foi impactado (segurança, respeito, clareza, parceria…).',
    'Passo 3: formule um pedido concreto e verificável (o que, quando, como).',
    'Passo 4: imagine o que a outra pessoa diria se se sentisse ouvida. Ajuste o tom.',
    'Passo 5: proponha um acordo de 1–3 itens e defina como vão revisar em 7 dias.',
  ]
  return steps[Math.min(step, steps.length - 1)]
}
