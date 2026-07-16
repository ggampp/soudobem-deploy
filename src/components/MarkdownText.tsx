import { type ReactNode } from 'react'

/**
 * Markdown leve para respostas da IA.
 * Suporta: #/##/###, **negrito**, *itálico*, `código`, listas -/* e 1.
 * Sem HTML cru — só nós React.
 */

type InlineToken = { type: 'text' | 'bold' | 'italic' | 'code'; value: string }

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let i = 0

  while (i < text.length) {
    // **negrito**
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'bold', value: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }

    // __negrito__
    if (text.startsWith('__', i)) {
      const end = text.indexOf('__', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'bold', value: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }

    // `código`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        tokens.push({ type: 'code', value: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // *itálico* (não **)
    if (text[i] === '*' && text[i + 1] !== '*') {
      let end = i + 1
      while (end < text.length) {
        if (text[end] === '*' && text[end + 1] !== '*') break
        end++
      }
      if (end < text.length && text[end] === '*') {
        tokens.push({ type: 'italic', value: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }

    // texto até o próximo token
    let j = i + 1
    while (j < text.length) {
      if (text.startsWith('**', j) || text.startsWith('__', j) || text[j] === '`') break
      if (text[j] === '*' && text[j + 1] !== '*') break
      j++
    }
    tokens.push({ type: 'text', value: text.slice(i, j) })
    i = j
  }

  return tokens
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return tokenizeInline(text).map((tok, i) => {
    const k = `${keyPrefix}-${i}`
    if (tok.type === 'bold') {
      return (
        <strong key={k} className="font-semibold">
          {tok.value}
        </strong>
      )
    }
    if (tok.type === 'italic') {
      return (
        <em key={k} className="italic">
          {tok.value}
        </em>
      )
    }
    if (tok.type === 'code') {
      return (
        <code key={k} className="rounded-md bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.value}
        </code>
      )
    }
    return <span key={k}>{tok.value}</span>
  })
}

function headingClass(level: number): string {
  if (level === 1) return 'mt-3 mb-1.5 text-base font-extrabold tracking-tight first:mt-0'
  if (level === 2) return 'mt-3 mb-1.5 text-[0.95rem] font-bold tracking-tight first:mt-0'
  return 'mt-2.5 mb-1 text-sm font-bold first:mt-0'
}

export function MarkdownText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const source = (text ?? '').replace(/\r\n/g, '\n').trimEnd()
  if (!source) return null

  const lines = source.split('\n')
  const blocks: ReactNode[] = []
  let ulItems: string[] = []
  let olItems: string[] = []
  let key = 0

  function flushUl() {
    if (!ulItems.length) return
    const items = ulItems
    ulItems = []
    const listKey = key++
    blocks.push(
      <ul
        key={`ul-${listKey}`}
        className="my-1.5 list-disc space-y-1 pl-5 marker:text-muted-foreground"
      >
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item, `ul-${listKey}-${idx}`)}
          </li>
        ))}
      </ul>,
    )
  }

  function flushOl() {
    if (!olItems.length) return
    const items = olItems
    olItems = []
    const listKey = key++
    blocks.push(
      <ol
        key={`ol-${listKey}`}
        className="my-1.5 list-decimal space-y-1 pl-5 marker:text-muted-foreground"
      >
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item, `ol-${listKey}-${idx}`)}
          </li>
        ))}
      </ol>,
    )
  }

  function flushLists() {
    flushUl()
    flushOl()
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')

    // lista: - item | • item | * item (não **texto**)
    const ulMatch =
      line.match(/^\s*[-•]\s+(.+)$/) ||
      (line.match(/^\s*\*\s+/) && !line.match(/^\s*\*\*/)
        ? line.match(/^\s*\*\s+(.+)$/)
        : null)
    if (ulMatch) {
      flushOl()
      ulItems.push(ulMatch[1])
      continue
    }

    // lista numerada: 1. item | 1) item
    const olMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (olMatch) {
      flushUl()
      olItems.push(olMatch[1])
      continue
    }

    flushLists()

    if (line.trim() === '') {
      blocks.push(<div key={`sp-${key++}`} className="h-2" aria-hidden />)
      continue
    }

    // títulos: # ## ### ####
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const Tag = (`h${Math.min(level + 2, 6)}` as 'h3' | 'h4' | 'h5' | 'h6')
      const lineKey = key++
      blocks.push(
        <Tag key={`h-${lineKey}`} className={headingClass(level)}>
          {renderInline(heading[2], `h-${lineKey}`)}
        </Tag>,
      )
      continue
    }

    const lineKey = key++
    blocks.push(
      <p key={`p-${lineKey}`} className="my-1 leading-relaxed">
        {renderInline(line, `p-${lineKey}`)}
      </p>,
    )
  }

  flushLists()

  return <div className={`markdown-text ${className}`.trim()}>{blocks}</div>
}
