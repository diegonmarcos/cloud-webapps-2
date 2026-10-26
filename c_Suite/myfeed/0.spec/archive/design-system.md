# MyFeed - Design System

## 1. Design Philosophy

MyFeed combines the mysterious elegance of **obsidian purple** with the refined **glassy aesthetics** of Apple's design language. The result is a sophisticated, modern interface that feels premium, immersive, and easy on the eyes.

### 1.1 Core Principles

- **Glass Morphism:** Translucent surfaces with subtle blur effects
- **Depth & Layering:** Strategic use of shadows and elevation
- **Purple Mystique:** Rich purple tones inspired by obsidian stone
- **Minimalism:** Clean, uncluttered interfaces
- **Smooth Motion:** Fluid animations and transitions
- **Dark-First:** Optimized for dark mode with light mode support

## 2. Color Palette

### 2.1 Primary Colors - Obsidian Purple

```css
/* Base Purple Shades */
--obsidian-950: #1a0b2e;  /* Deepest purple, almost black */
--obsidian-900: #2d1b4e;  /* Deep background */
--obsidian-800: #3f2b5e;  /* Dark surface */
--obsidian-700: #523c6e;  /* Medium dark */
--obsidian-600: #7c5cbf;  /* Primary purple */
--obsidian-500: #9b7fd4;  /* Medium purple */
--obsidian-400: #b89ee8;  /* Light purple */
--obsidian-300: #d4c3f5;  /* Very light purple */
--obsidian-200: #e9e0fa;  /* Pale purple */
--obsidian-100: #f5f2fd;  /* Almost white with purple tint */

/* Accent Purples */
--amethyst-glow: #a78bfa;    /* Bright accent */
--violet-accent: #8b5cf6;    /* Strong accent */
--lavender-soft: #c4b5fd;    /* Soft highlight */
```

### 2.2 Secondary Colors

```css
/* Grays with Purple Tint */
--gray-950: #0f0a1a;  /* Near black with purple */
--gray-900: #1e1731;  /* Very dark */
--gray-800: #2d2540;  /* Dark */
--gray-700: #3d3450;  /* Medium dark */
--gray-600: #5c5470;  /* Medium */
--gray-500: #7b7690;  /* Medium light */
--gray-400: #a39db0;  /* Light */
--gray-300: #c4c0cc;  /* Very light */
--gray-200: #e1dfe6;  /* Pale */
--gray-100: #f0eff3;  /* Almost white */

/* Semantic Colors */
--success: #10b981;    /* Green */
--warning: #f59e0b;    /* Amber */
--error: #ef4444;      /* Red */
--info: #3b82f6;       /* Blue */
```

### 2.3 Glass Effect Colors

```css
/* Glassmorphism Overlays */
--glass-white: rgba(255, 255, 255, 0.1);
--glass-purple: rgba(139, 92, 246, 0.1);
--glass-dark: rgba(15, 10, 26, 0.4);

/* Borders */
--glass-border: rgba(255, 255, 255, 0.2);
--glass-border-strong: rgba(255, 255, 255, 0.3);

/* Shadows */
--glass-shadow: rgba(0, 0, 0, 0.1);
--glass-shadow-strong: rgba(0, 0, 0, 0.3);
```

## 3. Typography

### 3.1 Font Families

```css
/* Primary Font - System UI */
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                'Helvetica Neue', Arial, sans-serif;

/* Alternative - Modern Serif for Articles */
--font-serif: 'Charter', 'Georgia', 'Iowan Old Style', serif;

/* Monospace - Code Blocks */
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
```

### 3.2 Font Scales

```css
/* Desktop Scale */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 3.3 Typography Usage

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 - Page Title | Primary | 3xl-4xl | Bold | Tight |
| H2 - Section | Primary | 2xl-3xl | Semibold | Tight |
| H3 - Card Title | Primary | xl-2xl | Semibold | Normal |
| Body - Default | Primary | base | Normal | Relaxed |
| Body - Article | Serif | lg | Normal | Relaxed |
| Caption | Primary | sm | Medium | Normal |
| Label | Primary | sm | Semibold | Normal |
| Code | Mono | sm | Normal | Normal |

## 4. Spacing System

### 4.1 Spacing Scale (8px base)

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 4.2 Component Spacing

- **Card Padding:** 24px (desktop), 16px (mobile)
- **Card Gap:** 24px (desktop), 16px (mobile)
- **Section Spacing:** 48px (desktop), 32px (mobile)
- **Inline Spacing:** 8-12px for buttons, chips, icons

## 5. Glass Morphism Effects

### 5.1 Glass Card Component

```css
.glass-card {
  background: rgba(45, 27, 78, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### 5.2 Glass Variations

**Strong Glass (Header/Modal):**
```css
.glass-strong {
  background: rgba(45, 27, 78, 0.8);
  backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**Subtle Glass (Secondary Cards):**
```css
.glass-subtle {
  background: rgba(45, 27, 78, 0.4);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

**Light Mode Glass:**
```css
.glass-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
```

## 6. Elevation & Shadows

### 6.1 Shadow Levels

```css
/* Subtle elevation */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);

/* Default cards */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15),
             0 2px 4px rgba(0, 0, 0, 0.1);

/* Hover state */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2),
             0 4px 8px rgba(0, 0, 0, 0.15);

/* Modal/Popup */
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.3),
             0 8px 16px rgba(0, 0, 0, 0.2);

/* Glow effect for accents */
--glow-purple: 0 0 20px rgba(139, 92, 246, 0.4),
               0 0 40px rgba(139, 92, 246, 0.2);
```

### 6.2 Elevation Usage

- **Z-Index Levels:**
  - Base content: 0
  - Feed cards: 1
  - Sticky header: 10
  - Dropdowns: 20
  - Modals: 30
  - Tooltips: 40

## 7. Border Radius

```css
--radius-sm: 8px;    /* Small elements, chips */
--radius-md: 12px;   /* Buttons, inputs */
--radius-lg: 16px;   /* Cards, containers */
--radius-xl: 24px;   /* Large cards, modals */
--radius-full: 9999px; /* Pills, avatars */
```

## 8. Animations & Transitions

### 8.1 Timing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 8.2 Duration Scale

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;
```

### 8.3 Common Transitions

```css
/* Hover transitions */
.transition-hover {
  transition: all 250ms var(--ease-smooth);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Glow pulse */
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
  }
}
```

## 9. Component Patterns

### 9.1 Button Styles

**Primary Button:**
```css
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 250ms ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}
```

**Glass Button:**
```css
.btn-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 500;
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
```

### 9.2 Input Fields

```css
.input-glass {
  background: rgba(45, 27, 78, 0.4);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
}

.input-glass:focus {
  outline: none;
  border-color: var(--violet-accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.input-glass::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
```

### 9.3 Card Hover States

```css
.feed-card {
  transform: translateY(0);
  transition: all 350ms var(--ease-smooth);
}

.feed-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.3);
}

.feed-card:hover .card-thumbnail {
  transform: scale(1.05);
}
```

## 10. Iconography

### 10.1 Icon Style

- **Library:** Lucide React (consistent, modern icons)
- **Size Scale:**
  - Small: 16px (inline text)
  - Medium: 20px (buttons, labels)
  - Large: 24px (headers, primary actions)
  - XLarge: 32px (empty states, illustrations)

### 10.2 Icon Colors

```css
--icon-primary: rgba(255, 255, 255, 0.9);
--icon-secondary: rgba(255, 255, 255, 0.6);
--icon-accent: #8b5cf6;
--icon-success: #10b981;
--icon-warning: #f59e0b;
--icon-error: #ef4444;
```

## 11. Background Patterns

### 11.1 Main Background

```css
.app-background {
  background: linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 50%, #1a0b2e 100%);
  position: relative;
}

/* Subtle noise texture */
.app-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}
```

### 11.2 Gradient Overlays

```css
/* Top gradient fade */
.gradient-fade-top {
  background: linear-gradient(180deg,
    rgba(26, 11, 46, 1) 0%,
    rgba(26, 11, 46, 0) 100%
  );
}

/* Radial spotlight */
.gradient-spotlight {
  background: radial-gradient(
    circle at 50% 0%,
    rgba(139, 92, 246, 0.15) 0%,
    rgba(139, 92, 246, 0) 50%
  );
}
```

## 12. Dark Mode / Light Mode

### 12.1 Theme Toggle

MyFeed is **dark-first** but supports light mode:

**Dark Mode (Default):**
- Background: Obsidian purple gradients
- Cards: Glass with purple tint
- Text: White to gray scale
- Accents: Bright purple (#8b5cf6)

**Light Mode:**
- Background: Soft white with purple tint
- Cards: White glass with subtle shadows
- Text: Dark gray to black
- Accents: Deep purple (#7c3aed)

### 12.2 Theme Implementation

```css
/* Dark theme (default) */
:root {
  --bg-primary: var(--obsidian-950);
  --bg-secondary: var(--obsidian-900);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
}

/* Light theme */
[data-theme="light"] {
  --bg-primary: var(--obsidian-100);
  --bg-secondary: #ffffff;
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
}
```

## 13. Accessibility Considerations

### 13.1 Color Contrast

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### 13.2 Focus States

```css
*:focus-visible {
  outline: 2px solid var(--violet-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 13.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 14. Implementation Checklist

### Phase 1: Foundation
- [ ] Set up CSS custom properties
- [ ] Create Tailwind config with custom colors
- [ ] Implement glass card base component
- [ ] Set up typography system
- [ ] Create icon library wrapper

### Phase 2: Components
- [ ] Build button variants
- [ ] Create input components
- [ ] Implement card hover animations
- [ ] Build loading states
- [ ] Create empty states

### Phase 3: Polish
- [ ] Add micro-interactions
- [ ] Implement theme toggle
- [ ] Add scroll animations
- [ ] Optimize for reduced motion
- [ ] Test accessibility

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Design Status:** Ready for Implementation
