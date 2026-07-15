# Sou do Bem — Design System

## Brand
- Product: SocialTech de confiança / reputação comportamental
- Style: Trust & Authority + Community (warm, welcoming)
- Brand anchor: amarelo ouro `#F5C828` (não trocar por teal genérico)

## Colors (semantic)
| Token | Hex | Use |
|-------|-----|-----|
| primary | `#E8B60F` | CTA (ligeiramente mais escuro que logo para contraste AA) |
| primary-glow | `#F5C828` | highlights |
| primary-foreground | `#1A1500` | texto em botão primary |
| background | `#FAF8F2` | fundo app |
| foreground | `#1C1914` | texto principal ≥4.5:1 |
| muted | `#F0EBE0` | superfícies secundárias |
| muted-foreground | `#524C40` | texto secundário ≥4.5:1 em bg |
| card | `#FFFFFF` | cards |
| border | `#E0D9C8` | divisores |
| success | `#1F7A4D` | sucesso |
| danger | `#B91C1C` | erro/destrutivo |
| info | `#1D4E89` | info |
| ring | `#C9A00A` | focus ring |

## Typography
- Family: **Plus Jakarta Sans** (headings + body) — moderna, legível, social
- Scale: 12 / 14 / 16 / 18 / 24 / 32
- Body: 16px, line-height 1.55
- Headings: extrabold, tracking-tight

## Spacing
- 4/8 rhythm: 4, 8, 12, 16, 24, 32, 48
- Card radius: 1.25rem (20px)
- Button radius: 1rem
- Touch targets: min 44×44px

## Motion
- 150–250ms ease-out
- `prefers-reduced-motion: reduce` → transitions none
- Prefer transform/opacity only

## Components
- One primary CTA per view
- Lucide icons only (no emoji as UI icons)
- Visible labels on all form fields
- Focus-visible rings always
- Loading + disabled states on async buttons

## Anti-patterns
- Placeholder-only labels
- Icon-only buttons without aria-label
- Hover-only interactions
- Text < 14px for body on mobile
- Gray-on-gray low contrast
