---
name: Efficient Velocity
colors:
  surface: '#f9f9ff'
  surface-dim: '#cadbfc'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dfe8ff'
  surface-container-highest: '#d6e3ff'
  on-surface: '#091c35'
  on-surface-variant: '#434654'
  inverse-surface: '#20314b'
  inverse-on-surface: '#ecf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#006c47'
  on-secondary: '#ffffff'
  secondary-container: '#82f9be'
  on-secondary-container: '#00734c'
  tertiary: '#432f9c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b49b5'
  on-tertiary-container: '#d5ccff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#82f9be'
  secondary-fixed-dim: '#65dca4'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#e5deff'
  tertiary-fixed-dim: '#c9bfff'
  on-tertiary-fixed: '#1a0063'
  on-tertiary-fixed-variant: '#4633a0'
  background: '#f9f9ff'
  on-background: '#091c35'
  surface-variant: '#d6e3ff'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  code:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style

The brand personality of the design system is authoritative, systematic, and transparent. Designed for high-performance SEO agencies and software houses, it prioritizes data clarity and task velocity over decorative flair. The emotional response is one of organized control—reducing the cognitive load of managing complex search engine optimization workflows.

The visual style is **Corporate / Modern** with a heavy influence of **Minimalism**. It utilizes a "Utility-First" approach where every element serves a functional purpose. The interface relies on clear structural hierarchies, intentional whitespace, and a sophisticated use of elevation to separate navigation, workspace, and utility panels.

## Colors

The color palette is anchored by a high-trust Primary Blue, optimized for interactive elements and brand recognition. The Success Green is used both for positive status indicators and growth-related SEO metrics.

To maintain a clean, professional workspace, the design system utilizes a tiered neutral scale. The light gray background provides a low-contrast canvas that allows white cards to "pop" via soft shadows. Status-specific colors are reserved for high-signal components like badges and progress bars to ensure they are immediately scannable within dense data tables.

## Typography

The design system uses **Inter** exclusively to leverage its exceptional legibility in data-heavy environments. The typographic scale is optimized for information density, favoring a smaller base size (14px) for dashboard content to maximize screen real estate.

Headlines use tighter letter spacing and heavier weights to provide clear section anchoring. Labels and status badges utilize a semi-bold weight and occasional uppercase styling to differentiate metadata from primary content. For technical SEO data, such as URL paths or meta-tags, a monospace fallback is used to ensure character-level clarity.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a standard 12-column layout, allowing the workspace to adapt from narrow task lists to wide, multi-column analytics dashboards. The spacing rhythm is strictly based on an 8px linear scale, ensuring consistent alignment across all React components.

Padding within cards and containers should remain generous (16px to 24px) to prevent the "data-cramming" effect common in legacy SEO tools. Tables should utilize a "Compact" vs "Comfortable" toggle, where row heights adjust between 40px and 56px based on user preference.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**. The interface uses a three-tier depth system:

1.  **Background (Level 0):** The Light Gray (#F4F5F7) base layer for the entire application.
2.  **Surface (Level 1):** Pure White (#FFFFFF) cards and table containers. These use a very soft, diffused shadow (0px 2px 4px rgba(0, 0, 0, 0.05)) to suggest subtle lift.
3.  **Overlay (Level 2):** Modals, dropdowns, and floating tooltips. These use a more pronounced shadow (0px 12px 24px rgba(0, 82, 204, 0.1)) with a slight blue tint to maintain brand harmony.

Interactive elements like buttons should show a slight increase in shadow depth on hover to provide tactile feedback without relying on heavy gradients.

## Shapes

The shape language is defined by modern, approachable geometry. Standard UI elements like input fields and buttons utilize an **8px (0.5rem)** radius to maintain a professional yet softened aesthetic. 

Larger containers, such as dashboard cards and modals, utilize a **12px (0.75rem)** radius. This subtle variation in rounding helps users subconsciously distinguish between small interactive components and structural content wrappers. Status badges and "pill" buttons utilize a fully rounded (capsule) radius to differentiate them from standard input fields.

## Components

### Buttons
Primary buttons use the Primary Blue with white text. Secondary buttons use a light gray outline or ghost style. All buttons feature a subtle transition on hover and an 8px border radius.

### Status Badges
Badges are essential for the workflow. They use a "Subtle Background" style (10% opacity of the text color):
- **Pending:** Gray (#7A869A)
- **In Progress:** Blue (#0052CC)
- **Submitted:** Purple (#6554C0)
- **Approved:** Success Green (#36B37E)
- **Revision Required:** Warning (#FFAB00)
- **Rejected:** Error (#DE350B)
- **Done:** Success Green with a check icon.

### Spreadsheet Tables
Tables are designed for high density. They feature sticky headers, zebra striping (very subtle gray on even rows), and clear vertical alignment. Cell borders should be light gray (#EBECF0) and minimal.

### Progress Bars
Used for task completion and SEO health scores. They feature a 4px height, a rounded track, and use the Success Green for the fill color to represent positive movement.

### Cards
Cards are the primary content container. They must be pure white, have 12px rounded corners, and include a soft shadow. Padding within cards is standardized at 24px for top-level summaries and 16px for secondary data.