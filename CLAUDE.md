# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**chiyaome** (吃药么) - WeChat Mini Program (微信小程序) for medication management/reminders.

**Design Philosophy:** "The Living Sanctuary" - Editorial, high-end wellness experience breaking the clinical coldness of traditional medical apps. Think premium wellness magazine meets medical tool.

## ⚠️ WeChat Mini Program Constraints

**This is a WeChat Mini Program (微信小程序), NOT a standard web project.** Before writing any code, remember:

### WXSS Limitations
- **No `* { }` universal selector** - Use explicit element list instead: `view, text, image { }`
- **No `@import url()` for external fonts** - Use system fonts or `wx.loadFontFace()` in JS
- **No CSS animations on many properties** - Prefer `transform` and `opacity`
- **No `position: fixed`** inside scrollable areas - Use `position: absolute` with page-level fixed

### File Structure
- Pages must be registered in `app.json` under `pages` array
- Components must be declared in page's `.json` using `usingComponents`
- Each page requires 4 files: `.js`, `.json`, `.wxml`, `.wxss`

### API Constraints
- **No direct DOM access** - Must use `this.setData()` for updates
- **Storage uses `wx.getStorageSync()`** - Not localStorage
- **Network requests use `wx.request()`** - With specific header requirements
- **Must use WeChat login** - `wx.login()` for auth

### NPM & Dependencies
- Must run **"Tools → Build NPM"** in WeChat DevTools after `npm install`
- Only `tdesign-miniprogram` is pre-configured - verify other packages support Mini Programs

## Tech Stack

- **Platform:** WeChat Mini Program (微信小程序)
- **UI Framework:** [tdesign-miniprogram](https://github.com/Tencent/tdesign-miniprogram) - Tencent's official design system for Mini Programs
- **Styling:** Custom CSS overriding TDesign tokens to match "The Serene Healer" design system
- **Typography:** System Chinese fonts (PingFang SC / Microsoft YaHei)
- **TabBar:** Custom TabBar using TDesign icons (no image assets)

## TDesign Integration

### Installation
```bash
npm install tdesign-miniprogram
```

### Usage Pattern
Use TDesign components as base, override styles to match design system:

```json
// app.json
{
  "usingComponents": {
    "t-button": "tdesign-miniprogram/button/button",
    "t-cell": "tdesign-miniprogram/cell/cell",
    "t-card": "tdesign-miniprogram/card/card"
  }
}
```

### Style Override Strategy
TDesign components use CSS variables. Override in `app.wxss`:

```css
/* Override TDesign tokens to match Serene Healer */
page {
  --td-brand-color: #0058bc;
  --td-success-color: #006e28;
  --td-bg-color-page: #f9f9fe;
  --td-bg-color-container: #ffffff;
}
```

### Component Selection
| Use Case | TDesign Component | Customization |
|----------|------------------|---------------|
| Check-in Button | `t-button` | Override with gradient, rounded-full |
| Cards | Custom view | Use surface backgrounds, rounded-md |
| Inputs | `t-input` | surface-container-high background |
| Progress | `t-progress` | secondary/secondary_fixed colors |
| Lists | `t-cell` | No divider lines, spacing-based separation |

### Key Overrides
- Remove TDesign default borders (use `outline: none` or border-color: transparent)
- Replace box-shadows with tonal layering
- Apply custom gradient to primary CTAs
- Use `rounded-md` (12px) instead of default TDesign radius

## Design System (The Serene Healer)

### Core Rules
- **No 1px solid borders for sectioning** - Use background color shifts only
- **Tonal Layering over Drop Shadows** - Surfaces define hierarchy, not lines
- **Asymmetry over Rigid Grids** - Editorial breathing room

### Color Palette
```
Base Layer:              #f9f9fe  (surface)
Secondary Section:       #ededf2  (surface-container)
Primary Cards:           #ffffff  (surface-container-lowest)
Primary (Blue):          #0058bc  →  #0070eb  (135° gradient for CTAs)
Secondary (Green):       #006e28  →  #6ffb85  (Check-in button gradient)
Tertiary (Insights):     #4c4aca
Text Primary:            #1b1b1f  (on_surface)
Text Secondary:          #414755  (on_surface_variant)
Outline Ghost:           15% opacity outline_variant (if absolutely needed)
```

### Shadows (Ambient Only)
- **Glassmorphism:** surface @ 70% opacity + 20px backdrop-blur
- **Primary CTA Shadow:** rgba(0, 88, 188, 0.08), 24px blur, 8px Y-offset
- **Never use grey/black shadows**

### Typography Scale
| Token | Font | Size | Usage |
|-------|------|------|-------|
| headline-lg | System Display | 64rpx | Hero stats, daily steps |
| body-md | System Body | 28rpx | Medical descriptions |
| label-md | System Body | 24rpx | Metadata, captions |

### Spacing System (4px base)
- `spacing-4` (1rem): Side margins for text
- `spacing-5` (1.25rem): Card internal padding
- `spacing-8` (2rem): Section gaps, editorial breathing room
- `spacing-10`: Major section breaks

### Component Specs

**Signature Check-in Button**
- Shape: `rounded-full`
- Gradient: secondary (#006e28) → secondary_container (#6ffb85)
- Interaction: `scale(0.98)` on tap

**Cards**
- Radius: `rounded-md` (12px) or `rounded-lg` (16px)
- No divider lines - use spacing-4 vertical white space
- Inset dividers only (surface-variant, not touching edges)

**Input Fields**
- Background: surface-container-high
- Radius: `rounded-sm` (8px)
- Active: surface-container-lowest + 2px primary "ghost border"

**Progress Tracks**
- Track: secondary_fixed
- Fill: secondary

## Architecture Patterns

### Surface Hierarchy (Nested Layers)
```
surface (#f9f9fe)                    // Page background
  └── surface-container (#ededf2)    // Secondary sections
        └── surface-container-lowest // Primary cards (white)
```

### Color Usage by Intent
- **Primary (Blue):** Medical precision, main CTAs
- **Secondary (Green):** Organic growth, health progress, check-in
- **Tertiary (Purple):** Educational chips, insights
- **Surface-dim:** Inactive states

### Layout Principles
- 16px (spacing-4) strict side margins for text-heavy content
- Intentional asymmetry - avoid rigid center alignment
- Content "bleeds" through glassmorphic headers

## Commands (To Be Added)

Once the build system is configured, add:
- Dev server command
- Build for production
- Lint/styling checks
- Testing commands

## File Structure

Standard WeChat Mini Program structure with TDesign:

```
/node_modules           - npm dependencies (tdesign-miniprogram)
/pages                  - Page components
/components             - Reusable components
/custom-tab-bar         - Custom tabBar component (uses TDesign icons)
/utils                  - Utilities
/app.js                 - App entry
/app.json               - App config with TDesign usingComponents
/app.wxss               - Global styles + TDesign token overrides
/project.config.json    - WeChat DevTools config
/package.json           - npm manifest
```

### TDesign Setup Notes

1. **npm init required:** WeChat Mini Programs need `miniprogramRoot` and proper npm configuration
2. **Build npm:** After installing dependencies, use WeChat DevTools menu: `Tools → Build npm`
3. **Component path:** TDesign components resolve from `miniprogram_npm/tdesign-miniprogram/`

### Custom TabBar

This project uses a **custom tabBar** (`custom-tab-bar/`) to use TDesign icons instead of image assets:

- TabBar icons use `t-icon` component (home, calendar, pill, user)
- Each tab page must sync selected state in `onShow()`:

```javascript
onShow() {
  if (typeof this.getTabBar === 'function' && this.getTabBar()) {
    this.getTabBar().setData({ selected: 0 }) // 0-3 for each tab
  }
}
```

- App.json enables custom tabBar with `"custom": true` in tabBar config
