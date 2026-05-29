# Design System — Multitenant E-Commerce Platform
### Mobile-First · React Native + React Native for Web

---

## 1. Design Philosophy

**Core Aesthetic Direction: "Refined Electric"**

The visual language is clean, airy, and confident — light surfaces let product photography breathe and prices read instantly. The deep near-black (`#222022`) anchors typography and heavy UI elements with authority, while the electric yellow-lime (`#c3d809`) fires at the moments that matter: CTAs, active states, price highlights, confirmations. Nothing competes with product. Everything serves the transaction.

The 3D icons create moments of delight and tactility. Animated icons guide attention at key interaction points. Flat Expo icons carry functional meaning in dense UI areas. The system breathes: airy where it needs to invite, bold where it needs to convert.

**Three Guiding Principles:**
1. **Contrast is hierarchy.** The palette's natural tension (light background / dark type / electric accent) creates clear focal points — never let elements compete at the same visual weight.
2. **Motion earns its place.** Animate to communicate, not to decorate. Every animated element must signal something: confirmation, progress, or invitation.
3. **Mobile shapes everything.** Spacing, tap targets, and component density are designed for thumbs first, then scaled up gracefully for web.

---

## 2. Color Palette

### Core Colors

| Token | Hex | Role |
|---|---|---|
| `--color-primary` | `#c3d809` | Brand accent, CTAs, active states, highlights, focus rings |
| `--color-ink` | `#222022` | Primary text, icons on light, heavy UI elements |
| `--color-ink-soft` | `#3a383a` | Secondary text, subheadings, inactive labels |
| `--color-ink-muted` | `#6b696b` | Placeholder text, captions, helper text |
| `--color-ink-ghost` | `#9e9c9e` | Disabled text, decorative dividers |
| `--color-surface` | `#ffffff` | Primary screen background, card backgrounds |
| `--color-surface-soft` | `#f5f5f0` | Page background, section fills, input backgrounds |
| `--color-surface-muted` | `#eceae6` | Borders, dividers, skeleton base, chip backgrounds |
| `--color-surface-deep` | `#e0deda` | Pressed surface states, strong dividers |

### Accent & Feedback

| Token | Hex | Role |
|---|---|---|
| `--color-primary-dim` | `#9faf07` | Pressed/active state of primary CTA |
| `--color-primary-ghost` | `#c3d80920` | Primary tint: badge backgrounds, chip fills, focus halos |
| `--color-primary-border` | `#c3d80960` | Subtle primary borders (focused inputs, selected cards) |
| `--color-success` | `#2d9e5f` | Order confirmed, payment success, in-stock |
| `--color-success-ghost` | `#2d9e5f18` | Success badge background |
| `--color-warning` | `#d4820a` | Low stock, pending, expiring deals |
| `--color-warning-ghost` | `#d4820a18` | Warning badge background |
| `--color-error` | `#d93651` | Errors, destructive actions, out-of-stock |
| `--color-error-ghost` | `#d9365118` | Error badge background |
| `--color-info` | `#3a7ef5` | Informational banners, tooltips, help text |
| `--color-info-ghost` | `#3a7ef518` | Info badge background |

### Dark Mode (opt-in for web tenants)

Dark mode is a **secondary, opt-in experience** for web. Mobile is always light-first. When dark mode is enabled on web:

| Light Token | Dark Override |
|---|---|
| `--color-surface` | `#222022` |
| `--color-surface-soft` | `#2e2c2e` |
| `--color-surface-muted` | `#3a383a` |
| `--color-surface-deep` | `#4f4d4f` |
| `--color-ink` | `#f0f0ec` |
| `--color-ink-soft` | `#c8c6c8` |
| `--color-ink-muted` | `#9e9c9e` |
| `--color-ink-ghost` | `#6b696b` |

### Usage Rules
- **Light mode is the default and primary experience** on all platforms. All components are designed and tested light-first.
- `--color-primary` (#c3d809) is **accent only** — never use it as a large background fill. It earns its energy by being rare.
- **Never use `--color-primary` as text color on white/light surfaces** — it fails contrast at small sizes. Use `--color-ink` for text always.
- `--color-primary` as text is only acceptable at `Inter Bold 20px` or larger, checked to pass 3:1 contrast against `--color-surface`.
- The only text that should sit on a `--color-primary` background is `--color-ink` (`#222022`). Never white on lime.
- Never use more than **two accent colors** on one screen — primary + one feedback color maximum.
- Maintain **4.5:1 contrast ratio** minimum for all text/background combinations (WCAG AA).
- Shadows on light surfaces are soft and warm: use `rgba(34, 32, 34, 0.08–0.16)`, never cool grey shadows.

---

## 3. Typography

### Type Scale

**Headers — Inter**
Used for: Screen titles, section headers, product names, hero text, price displays, tab labels, CTAs.

```
Display XL   Inter Bold       40px / line-height 1.1  / tracking -0.02em
Display L    Inter Bold       32px / line-height 1.15 / tracking -0.015em
Heading 1    Inter SemiBold   26px / line-height 1.2  / tracking -0.01em
Heading 2    Inter SemiBold   22px / line-height 1.25 / tracking -0.008em
Heading 3    Inter Medium     18px / line-height 1.3  / tracking -0.005em
Label L      Inter SemiBold   15px / line-height 1.3  / tracking 0em
Label M      Inter SemiBold   13px / line-height 1.3  / tracking 0.01em
Label S      Inter Bold       11px / line-height 1.2  / tracking 0.05em   (ALL CAPS ONLY)
```

**Body — Open Sans**
Used for: Product descriptions, reviews, onboarding copy, input fields, helper text, legal text, notifications, long-form content.

```
Body L       Open Sans Regular      16px / line-height 1.6  / tracking 0em
Body M       Open Sans Regular      14px / line-height 1.65 / tracking 0em
Body S       Open Sans Regular      12px / line-height 1.6  / tracking 0.01em
Body Strong  Open Sans SemiBold     14px / line-height 1.65 / tracking 0em
Caption      Open Sans Regular      11px / line-height 1.5  / tracking 0.02em
```

### Typography Color Pairings (Light Mode)

| Style | Text Color | Surface |
|---|---|---|
| Screen title, product name | `--color-ink` | `--color-surface` or `--color-surface-soft` |
| Section heading | `--color-ink` | any surface |
| Body / description | `--color-ink-soft` | any surface |
| Caption / helper | `--color-ink-muted` | any surface |
| Placeholder text | `--color-ink-ghost` | input background |
| Price (current) | `--color-ink` | any surface |
| Discount price | `--color-primary` | only at `Inter Bold 18px+` |
| CTA button label | `--color-ink` | `--color-primary` button |
| Inverted text (on dark band) | `#ffffff` | `--color-ink` background |

### Typography Rules
- **Prices and key numbers** always use `Inter Bold` — numbers must feel assertive and scannable.
- **Product titles** use `Inter SemiBold` — never Inter Regular for product names.
- **Body copy blocks** longer than 3 lines always use `Open Sans` — Inter is too tight for reading comfort at length.
- **All-caps labels** (Label S) are for category tags, status chips, and section overlines only. Never for full sentences or product names.
- **Minimum font size** on mobile: `11px` (Caption). Never go below this.
- Line length (measure): **45–72 characters** max for body text on web. On mobile: **34–50 characters**.
- Avoid mixing more than **two weights** of the same font in a single card component.
- **Section overlines** (e.g., "TRENDING NOW", "FLASH SALE") use `Label S` in `--color-primary` or `--color-ink-muted`. This is the one place `--color-primary` appears as text — large, bold, brief.

---

## 4. Spacing & Layout Grid

### Spacing Scale (4pt base unit)

```
space-1     4px    Inline icon gap, tight badge padding
space-2     8px    Chip padding, icon-to-label gap
space-3    12px    Input horizontal padding, small component gap
space-4    16px    Standard component padding, list item gap, screen margin
space-5    20px    Section inner padding
space-6    24px    Card padding, component section gap
space-8    32px    Large section gap, modal padding
space-10   40px    Screen top padding, hero section padding
space-12   48px    Large hero sections
space-16   64px    Web-only section dividers, page-level breathing room
```

### Mobile Layout
- **Screen horizontal margin:** `space-4` (16px) — sacred. No content touches the screen edge.
- **Bottom safe area:** Always add `34px` padding on screens with bottom navigation (iPhone home indicator safety).
- **Touch targets:** Minimum `44×44px` for all interactive elements (Apple HIG standard).
- **Bottom navigation height:** `64px` + safe area inset.
- **Status bar:** Always use dark-content status bar icons (dark text/icons on light status bar).

### Web Layout (React Native for Web)
- **Max content width:** `1200px`, centered.
- **Column grid:** 12-column with `24px` gutters.
- **Breakpoints:**
  - `sm`: 480px (large phone landscape)
  - `md`: 768px (tablet)
  - `lg`: 1024px (desktop)
  - `xl`: 1280px (wide desktop)
- **Web-only:** sticky header at `64px` height. Content starts below this.

---

## 5. Iconography System

This project uses **three icon tiers**. Each tier has a defined role. Never swap tiers arbitrarily — the visual weight difference between a 3D icon and a flat Expo icon is intentional and communicates context to the user.

---

### Tier 1 — 3D Icons
**Purpose:** Delight, brand moments, category anchors, empty states, onboarding.

3D icons are **high-attention, low-frequency** elements. They live where the user is pausing, choosing, or being welcomed — never in task-dense functional areas.

**Where to use 3D icons:**
- **Home screen category grid** — each product category gets its own 3D icon (Electronics, Fashion, Home, Beauty, Food, Sports, etc.)
- **Onboarding screens** — each onboarding step uses a large centered 3D icon (`120×120px`)
- **Empty states** — cart empty, wishlist empty, no search results, no orders yet, no internet
- **Achievement / reward moments** — order confirmed hero, coupon unlocked, loyalty milestone
- **Tenant splash / welcome screen** — the store's hero visual above the fold
- **Benefits row** — "Free Delivery," "Secure Checkout," "Easy Returns" each get a 3D icon (`64px`)

**3D Icon Style Rules:**
- Lighting direction: **soft diffused light from upper-left**, consistent across the entire icon set.
- On light surfaces, icons must have **defined form shadows** — soft drop shadow below: `rgba(34,32,34,0.14) blur 20px offset-y 8px`.
- Icon body tones: **white, light grey, soft cream, or pale primary** as base surfaces.
- `#c3d809` appears as an **accent detail** on every 3D icon — a bag clasp, a star glow, a checkmark ribbon, a box seal. This ties the set to the brand.
- **Size:** `80–120px` on mobile. `96–140px` on web hero contexts. `64px` in benefits rows.
- **Never** place a 3D icon inline with body text — they are display-only and require breathing room: minimum `space-8` (32px) clear space on all sides.
- **Entrance animation:** scale from `0.85 → 1.0` + fade from `0 → 1`, ease-out, `320ms`.
- **Never use 3D icons in functional, dense, or task-focused screens** (checkout, cart, filters, settings, forms).

---

### Tier 2 — Animated Icons
**Purpose:** Feedback, micro-interactions, loading states, action confirmation.

Animated icons are **motion signals**. They tell the user something just happened, is happening, or is about to happen. They attract the eye briefly and then rest.

**Where to use animated icons:**
- **Add to Cart confirmation** — animated bag icon bounces/pulses on the button after tap
- **Wishlist heart toggle** — heart animates from outline to fill with a spring bounce
- **Loading states** — branded animated icon at center of loading screens (not a generic spinner)
- **Pull-to-refresh** — animated icon at the top of scrollable lists while refreshing
- **Success confirmation screens** — animated checkmark on order placed, payment success, review submitted
- **Bottom navigation active state** — the active tab icon plays a brief entrance animation on first selection
- **Search bar focus** — search icon pulses gently when the field is focused
- **Notification bell** — subtle ring/shake animation when a new notification badge appears
- **Star rating submission** — stars fill in sequentially with a scale pop when a review is submitted
- **Flash sale countdown timer** — animated digits or flame icon for urgency
- **Coupon / reward unlock** — a sparkle or burst animation on unlock

**Animated Icon Rules:**
- All durations: **200–400ms**. Easing: ease-in-out or spring.
- **Never loop indefinitely** unless the icon represents an active loading state. All interaction-triggered animations are one-shot.
- Animated icons on light surfaces should be `--color-ink` base with `--color-primary` as the highlight/fill color.
- On light surfaces, avoid heavy drop shadows on animated icons — they distract during motion.
- On web (React Native for Web), all animations must respect `prefers-reduced-motion`. Fallback: static icon + instant state change.
- Animated icons: `32×32px` inline, `48×48px` in button contexts, `64×64px` in success/confirmation screens.

---

### Tier 3 — Flat Expo Icons (`@expo/vector-icons`)
**Purpose:** Navigation, actions, utility, form fields, dense UI.

Flat Expo icons are the **workhorse** of the UI. They carry functional meaning quietly and must never distract from content or product.

**Where to use flat Expo icons:**
- **Bottom tab navigation** — inactive tab states (active states use Tier 2)
- **Header bar actions** — back arrow, search, cart, overflow menu
- **Form fields** — leading icons in inputs (email, phone, lock, user, location)
- **List item trailing** — `chevron-right` for drill-down rows
- **Filter and sort controls** — filter icon, sort icon, grid/list view toggle
- **Product detail** — share icon, flag/report icon, size guide icon
- **Checkout flow** — step icons (lock, credit card, truck, checkmark)
- **Settings screens** — every setting row has a leading flat icon
- **Toast / snackbar** — small status icon beside the message
- **Inline text actions** — edit pencil, delete trash, copy, link

**Flat Icon Style Rules on Light Surfaces:**
- **Inactive / default:** `--color-ink-muted` (`#6b696b`)
- **Active / focused / selected:** `--color-ink` (`#222022`)
- **Accent action (e.g. active tab, selected filter):** `--color-ink` (`#222022`) — primary color is used on the indicator, not the icon itself
- **Destructive action (delete, remove):** `--color-error`
- **Primary icon set:** `Ionicons` from `@expo/vector-icons`. Switch to `MaterialIcons` or `Feather` only when a specific icon is unavailable in Ionicons — document the exception.
- **Sizes:** `20px` for field/inline icons, `24px` for navigation and action icons, `28px` for header actions.
- **Never mix outline and filled variants** in the same context zone. Tabs: all outline. Form fields: all filled. Header: all outline.
- Tab icons that are active replace to Tier 2 animated version; inactive always flat.

---

## 6. Component Guidelines

### Buttons

**Primary Button**
- Background: `--color-primary` (`#c3d809`)
- Text: `Inter SemiBold 15px`, color `--color-ink` (`#222022`)
- Border radius: `12px`
- Height: `52px` (mobile), `48px` (web)
- Padding: `0 space-6` (0 24px)
- Pressed state: background `--color-primary-dim`, scale `0.97`, `100ms`
- Disabled: background `--color-surface-muted`, text `--color-ink-ghost`
- Shadow: `0 4px 12px rgba(195, 216, 9, 0.30)` — warm lime glow, reinforces the accent
- Icon: flat Expo OR animated icon on the left at `20px`. **Never** a 3D icon.

**Secondary Button**
- Background: `--color-surface`
- Border: `1.5px solid --color-surface-muted`
- Text: `Inter SemiBold 15px`, color `--color-ink`
- Border radius: `12px`
- Pressed state: background `--color-surface-soft`, border `--color-primary-border`
- Shadow: `0 2px 8px rgba(34,32,34,0.08)`

**Ghost / Text Button**
- No background, no border, no shadow
- Text: `Inter SemiBold 14px`, color `--color-ink-soft`
- Underline on hover (web)
- Used only for inline secondary actions: "View All", "See More", "Skip"

**Floating Action Button (FAB)**
- Size: `60×60px` circle
- Background: `--color-primary`
- Icon: Tier 2 animated icon, `28px`, color `--color-ink`
- Shadow: `0 6px 20px rgba(195, 216, 9, 0.35)`
- Placement: bottom-right corner, `space-4` from edge and bottom nav

**Destructive Button**
- Background: `--color-error-ghost`
- Border: `1px solid --color-error`
- Text: `Inter SemiBold 15px`, `--color-error`
- Used only in confirmation dialogs, not in main flows

---

### Cards

**Product Card**
- Background: `--color-surface`
- Border radius: `16px`
- Border: `1px solid --color-surface-muted`
- Padding: `space-3` (12px)
- Image container: full-width, `aspect ratio 1:1`, border radius `12px`, background `--color-surface-soft`
- Product name: `Inter SemiBold 14px`, `--color-ink`, max 2 lines
- Price: `Inter Bold 16px`, `--color-ink`
- Sale price: `Inter Bold 16px`, `--color-ink` with sale badge; original struck in `Open Sans 12px --color-ink-ghost`
- Wishlist button: top-right corner of image, Tier 2 animated heart, `28px`, on a `34×34px` white pill with `rgba(0,0,0,0.06)` shadow
- Shadow: `0 2px 10px rgba(34,32,34,0.08)`
- **Hover (web):** `translateY(-3px)`, shadow deepens to `0 8px 24px rgba(34,32,34,0.13)`, `200ms ease-out`

**Category Card**
- Background: `--color-surface-soft`
- Border radius: `20px`
- Border: `1px solid --color-surface-muted`
- Contains: **Tier 1 3D icon** centered (`72px`), category label `Inter SemiBold 13px --color-ink` below
- Aspect ratio: `1:1`
- Active / pressed: background `--color-primary-ghost`, border `1.5px solid --color-primary-border`

**Promotional / Banner Card**
- Full-width, border radius `16px`
- Background image with a gradient overlay: `linear-gradient(135deg, rgba(195,216,9,0.15) 0%, rgba(34,32,34,0.04) 100%)`
- OR solid `--color-ink` background with white + primary text for high-contrast promos
- Text on light promos: `--color-ink`. Text on dark promos: `#ffffff`

**Order / History Card**
- Background: `--color-surface`
- Border radius: `16px`
- Border: `1px solid --color-surface-muted`
- Left accent bar: `3px wide`, rounded, color matches order status (`--color-success`, `--color-warning`, `--color-error`)
- Status label: `Label S` (all caps, `Inter Bold 11px`)
- Flat Expo icons for order step indicators
- Shadow: `0 1px 6px rgba(34,32,34,0.06)`

**Review Card**
- Background: `--color-surface-soft`
- Border radius: `12px`
- Border: `1px solid --color-surface-muted`
- Stars: Tier 2 animated on submission. Static flat filled stars (`--color-primary`) for display.
- Reviewer avatar: `40×40px` circle, `2px border --color-primary-ghost` for verified buyers
- Verified badge: `Label S`, `--color-success`

---

### Navigation

**Bottom Tab Bar**
- Height: `64px` + safe area inset
- Background: `--color-surface` with `1px top border --color-surface-muted`
- Shadow above bar: `0 -2px 12px rgba(34,32,34,0.06)`
- **Inactive tabs:** flat Expo icon `24px` (`--color-ink-ghost`) + `Label S` label (`--color-ink-ghost`)
- **Active tab:** Tier 2 animated icon plays on selection; icon + label color `--color-ink`; `4×4px` dot indicator in `--color-primary` centered below the label

**Top App Bar / Header**
- Height: `56px` + status bar inset
- Background: `--color-surface`
- Bottom border: `1px solid --color-surface-muted`
- Title: `Inter SemiBold 18px`, `--color-ink`, centered (or left-aligned for list screens)
- Left action: flat Expo `chevron-back` `24px`, `--color-ink-soft`
- Right actions: max 2 flat Expo icons, `24px`, `--color-ink-soft`, `space-3` gap
- Cart badge: `18×18px` circle, `--color-primary` background, `Inter Bold 10px` `--color-ink`
- Shadow (web only, on scroll): `0 2px 8px rgba(34,32,34,0.08)`

**Drawer / Side Nav (web)**
- Width: `280px`
- Background: `--color-surface`
- Right border: `1px solid --color-surface-muted`
- Tenant logo at top: max `48px` height, `space-6` padding
- Nav items: flat Expo icon `20px` (`--color-ink-soft`) + `Inter Medium 15px` `--color-ink-soft`, `52px` row height
- Active item: `--color-primary-ghost` background, `--color-ink` icon + text, `3px left border --color-primary`
- Shadow: `4px 0 16px rgba(34,32,34,0.08)` on the right edge

**Breadcrumbs (web)**
- `Open Sans Regular 13px`, `--color-ink-muted`
- Separator: flat Expo `chevron-forward` `14px`, `--color-ink-ghost`
- Current page: `Open Sans SemiBold 13px`, `--color-ink`

---

### Inputs & Forms

**Text Input**
- Height: `52px`
- Background: `--color-surface-soft`
- Border: `1.5px solid --color-surface-muted`
- Border radius: `12px`
- Focused border: `1.5px solid --color-primary`
- Focused shadow: `0 0 0 3px --color-primary-ghost`
- Floating label: `Inter Medium 12px`, `--color-ink-muted`, animates above on focus
- Input text: `Open Sans Regular 15px`, `--color-ink`
- Leading icon: flat Expo `20px`, `--color-ink-muted`; shifts to `--color-ink` on focus
- Error state: border `--color-error`, focus shadow `--color-error-ghost`, helper text `Open Sans Regular 11px --color-error` below
- Padding: `0 space-4`

**Search Bar**
- Height: `48px`
- Background: `--color-surface-soft`
- Border: `1px solid --color-surface-muted`
- Border radius: `24px` (pill)
- Focused border: `1.5px solid --color-primary`
- Leading: Tier 2 animated search icon, gentle pulse on focus
- Input text: `Open Sans Regular 14px`, `--color-ink`
- Placeholder: `Open Sans Regular 14px`, `--color-ink-ghost`
- Clear button: flat Expo `close-circle` `20px`, `--color-ink-muted`, appears when text is present

**Dropdown / Select**
- Same visual as Text Input
- Trailing: flat Expo `chevron-down` `20px`, `--color-ink-muted`
- Open: border `--color-primary`, dropdown panel `--color-surface` background, `12px` border radius, shadow `0 8px 24px rgba(34,32,34,0.12)`

**Checkbox & Radio**
- Size: `22×22px`
- Unchecked: border `1.5px --color-surface-deep`, transparent fill
- Checked: `--color-primary` fill, `--color-ink` checkmark (flat Expo), animated scale pop `0.8 → 1.0` on check
- Label: `Open Sans Regular 14px`, `--color-ink-soft`

---

### Chips & Badges

**Filter Chip**
- Height: `34px`, border radius `17px` (pill), padding `0 space-3`
- Inactive: background `--color-surface-soft`, border `1px --color-surface-muted`, `Inter Medium 12px --color-ink-soft`
- Active: background `--color-primary`, border `none`, `Inter SemiBold 12px --color-ink`
- Optional flat Expo icon left, `16px`, color inherits from label

**Status Badge**
- Height: `22px`, border radius `11px` (pill), padding `0 space-2`
- Label: `Label S` (all caps, `Inter Bold 10px`)
- Backgrounds use ghost tokens; text at full status color:
  - In Stock: `--color-success-ghost` + `--color-success`
  - Low Stock: `--color-warning-ghost` + `--color-warning`
  - Out of Stock: `--color-error-ghost` + `--color-error`
  - Sale: `--color-primary-ghost` + `--color-ink` (not primary as text — use ink for legibility)

**Discount Ribbon Badge**
- Background: `--color-error`
- Text: `Inter Bold 11px`, `#ffffff`
- Position: top-left corner of product image, `8px` inset
- Border radius: `0 0 8px 0` (bottom-right only — ribbon style)

**Count Badge (cart, notification)**
- `18×18px` circle, expands to pill when count > 9
- Background: `--color-primary`
- Text: `Inter Bold 10px`, `--color-ink`

---

### Product Detail Screen

- **Hero image:** full-width, `1:1` aspect ratio, white background, swipeable gallery
- **Image gallery thumbnails (web):** horizontal row, `60×60px`, selected thumbnail has `2px border --color-primary`
- **Image carousel dots (mobile):** `6×6px` circles `--color-surface-muted`, active becomes `20px` wide pill in `--color-primary`
- **Price block:** current price `Inter Bold 28px --color-ink`, original (struck) `Open Sans Regular 14px --color-ink-ghost`
- **Discount percentage:** `Label M --color-error` beside original price
- **Section dividers:** `1px solid --color-surface-muted`, `space-6` vertical margin
- **Variant selectors (size, color):** pill chips, active variant uses primary style
- **3D icon usage:** none — this is a task screen. Flat Expo icons only.
- **Animated icons:** wishlist heart toggle (Tier 2), add-to-cart confirmation burst (Tier 2)
- **Sticky bottom bar (mobile):** `--color-surface` background, `1px top border --color-surface-muted`, price + primary CTA button side by side

---

### Empty States

Empty states are a **brand moment**. Execute them with care.

**Structure:**
1. **Tier 1 3D Icon** — centered, `120px`, entrance animation (`0.85 → 1.0` scale + fade, `320ms`)
2. **Heading** — `Inter SemiBold 22px --color-ink`, centered, `space-4` below icon
3. **Body** — `Open Sans Regular 14px --color-ink-muted`, centered, max 2 lines, `space-2` below heading
4. **Primary CTA Button** — full-width or `240px` centered, `space-8` below body

**Icon examples:**
- Empty cart → 3D shopping bag (lime-green clasp detail)
- No orders yet → 3D cardboard box (lime-green seal/ribbon)
- No results → 3D magnifying glass (lime-green lens ring)
- No internet → 3D cloud with a broken signal (lime-green cloud body)
- Wishlist empty → 3D heart (lime-green gradient fill, hollow center)

---

### Modals & Bottom Sheets

**Bottom Sheet (mobile)**
- Background: `--color-surface`
- Top corners: `border-radius 24px`
- Bottom corners: `border-radius 0` (flush with screen bottom)
- Drag handle: `40×4px` pill, `--color-surface-deep`, centered, `space-3` from top
- Content padding: `space-6`
- Overlay: `rgba(34,32,34,0.45)` backdrop with blur `4px`
- Entrance: slides up from bottom, `320ms`, `cubic-bezier(0.34, 1.56, 0.64, 1)` spring

**Dialog / Modal (web)**
- Background: `--color-surface`
- Border radius: `20px`
- Border: `1px solid --color-surface-muted`
- Max width: `480px`, centered
- Shadow: `0 20px 60px rgba(34,32,34,0.18)`
- Overlay: `rgba(34,32,34,0.45)` backdrop blur `4px`
- Entrance: scales `0.95 → 1.0` + fade, `250ms ease-out`

---

### Toast / Snackbar

- Position: top of screen (mobile), bottom-center (web)
- Background: `--color-surface`
- Border: `1px solid --color-surface-muted`
- Border radius: `12px`
- Shadow: `0 4px 16px rgba(34,32,34,0.12)`
- Left edge accent bar: `3px wide`, rounded, status color
- Leading: flat Expo icon `20px`, status color
- Text: `Open Sans SemiBold 13px`, `--color-ink`
- Entrance: slides down from top (mobile) / up from bottom (web), `240ms spring`
- Auto-dismiss: `3000ms`

---

### Skeleton Loaders

- Base: `--color-surface-muted`
- Shimmer highlight: `--color-surface-deep` (slightly darker band sweeping left to right)
- Border radius: match the component being loaded (cards: `16px`, text lines: `4px`)
- Animation: `1200ms ease-in-out infinite`
- Always mirror the exact shape of the real content — no generic gray boxes

---

## 7. Tenant Theming

Each tenant can override only the following tokens. The rest of the system is locked to preserve quality across all storefronts.

```
--tenant-primary          // Replaces --color-primary
                          // Must pass 4.5:1 contrast against --color-ink (#222022) on white
--tenant-logo-url         // Header and splash logo asset
--tenant-hero-bg          // Home screen hero section background color or gradient
--tenant-font-display     // Override for Display XL and Display L only
                          // Inter remains default for all other heading levels
```

**Constraint:** If a tenant provides a `--tenant-primary` that fails the contrast check against `--color-ink` on `--color-surface`, the system silently falls back to `#c3d809`. Never degrade legibility for branding.

**What tenants cannot override:**
- Spacing scale, border radius language, shadow system
- Body font (always Open Sans)
- Icon tier rules and placement
- Component structure and layout
- Feedback colors (success/warning/error/info)

---

## 8. Motion & Animation Principles

| Type | Duration | Easing |
|---|---|---|
| Micro-interactions (tap press feedback) | 100–150ms | ease-out |
| Component entrance (cards, sheets, modals) | 240–320ms | cubic-bezier(0.34, 1.56, 0.64, 1) spring |
| Page / screen transitions | 280–360ms | ease-in-out |
| Tier 1 3D icon entrance | 320ms | ease-out |
| Tier 2 animated icon interactions | 200–400ms | spring |
| Skeleton shimmer pulse | 1200ms | ease-in-out, infinite |
| Hover state transitions (web) | 150–200ms | ease-out |
| Dropdown / sheet entrance | 240ms | ease-out |

**Rules:**
- **Stagger list items** by `40ms` delay per item on screen entrance. Max 5 items staggered; all remaining appear instantly.
- **Animate only `opacity` and `transform`** — never animate layout properties (`width`, `height`, `top`, `left`).
- **Skeleton screens over spinners** for all content loading. Skeletons match real content shape exactly.
- **Page transitions (mobile):** horizontal slide (push/pop) for drill-down, vertical slide for modals and sheets.
- **Page transitions (web):** subtle fade + slight upward translate (`translateY 8px → 0`) for route changes.
- **Never use `--color-primary`** as the color of a loading spinner or generic progress indicator — that dilutes its meaning as a brand accent.

---

## 9. Imagery & Visual Treatment

- **Product images:** always on a pure white or `--color-surface` background in thumbnails and cards. Never crop or mask product photos with color fills.
- **Aspect ratios:** `1:1` for product cards and thumbnails, `16:9` for promotional banners, `4:3` for category hero images.
- **Image loading:** fade in `0 → 1` opacity over `200ms` once loaded. Show skeleton while loading.
- **Lazy load** all images below the fold.
- **No image filters on product photography** — always show true color. Filters distort purchase decisions.
- **Banner / hero overlay** for text legibility on dark photos: `linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(255,255,255,0.88) 100%)` for light banners, or `rgba(34,32,34,0.55)` flat overlay for dark text-on-image layouts.
- **User avatars without images:** filled circle, `--color-primary-ghost` background, initials in `Inter SemiBold --color-ink`.

---

## 10. Accessibility Standards

- **Color contrast:** WCAG AA minimum everywhere — 4.5:1 for text, 3:1 for UI component boundaries.
- **Touch targets:** `44×44px` minimum for all interactive elements. Invisible padding extends the hitbox where needed.
- **Focus rings (web):** `2px solid --color-primary`, `2px offset` on all focusable elements. Never remove focus outlines.
- **Screen reader:** All icons must have `accessibilityLabel`. Product images need descriptive `alt` text, not just filenames.
- **Reduced motion:** All Tier 2 animations and entrance animations must respect `prefers-reduced-motion: reduce`. Fallback: instant state change + no transform.
- **Font scaling:** All type uses `rem` / `sp` units — never fixed `px` for text. UI remains usable at system font scale `1.3×`.
- **Minimum tappable text links:** `32px` height minimum with appropriate padding.
- **Status indicators** must never rely on color alone — always pair color with an icon or text label (e.g., "IN STOCK" text + green dot, not just a green dot).

---

## 11. Light & Shadow Language

On a light-first UI, shadows define elevation and separate layers. Use this scale consistently:

| Level | Shadow Value | Used For |
|---|---|---|
| Flat | none | Inline elements, chips, page background |
| Raised 1 | `0 1px 4px rgba(34,32,34,0.07)` | List rows, table rows |
| Raised 2 | `0 2px 10px rgba(34,32,34,0.09)` | Product cards, input fields |
| Raised 3 | `0 4px 16px rgba(34,32,34,0.12)` | Dropdowns, tooltips, toasts |
| Raised 4 | `0 8px 28px rgba(34,32,34,0.15)` | Bottom sheets, drawers |
| Raised 5 | `0 20px 60px rgba(34,32,34,0.18)` | Modals, dialogs |
| Primary glow | `0 4px 12px rgba(195,216,9,0.30)` | Primary CTA buttons only |
| FAB glow | `0 6px 20px rgba(195,216,9,0.35)` | Floating action buttons only |

**Rules:**
- The primary glow shadow is **exclusive to primary buttons and FABs** — nowhere else.
- Never stack two shadows on the same element.
- On mobile, shadows can be reduced by 30% since screens are closer to the eye and layering is implied by navigation structure.

---

## 12. Do's and Don'ts

### Do ✅
- Let `#c3d809` be the single brightest, most electric element on any screen. Guard its exclusivity.
- Give Tier 1 3D icons **room to breathe** — minimum `space-8` (32px) clear space on all sides.
- Use `Inter` for anything the user needs to **act on**. Use `Open Sans` for anything they need to **read**.
- Keep the shadow scale consistent — elevation should feel like a coherent physical stack, not random.
- Always test product card designs with real product images and long product names.
- Ensure every primary CTA button has the lime glow shadow — it signals tappability.
- Place the most important CTA at the **bottom of the mobile screen** (thumb zone).
- Use Tier 2 animated icons to **confirm actions** — they are the visual "yes, that worked."
- Pair every color-coded status with a text label or icon, never color alone.

### Don't ❌
- Don't use `#c3d809` as a text color on white/light surfaces at small sizes — it fails contrast.
- Don't use `#c3d809` as a large background fill (full cards, full screens) — it loses its energy.
- Don't mix Tier 1 and Tier 2 icons in the same visual cluster — too many levels of visual weight.
- Don't use `Inter` for body copy blocks longer than 3 lines — switch to `Open Sans`.
- Don't exceed 3 typographic sizes in a single card component.
- Don't use the primary glow shadow on anything except primary buttons and FABs.
- Don't animate purely for decoration — every motion must communicate state or progress.
- Don't add color overlays or filters to product photography.
- Don't let tenant branding override spacing, shadow, or feedback color tokens.
- Don't use gradient fills on `--color-primary` backgrounds — it works better flat, crisp, and electric.
