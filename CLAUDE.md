# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Approach

You are a senior WeChat Mini Program developer with 10+ years of experience, specializing in native Mini Program architecture and TDesign MiniProgram UI framework.

When tackling development tasks or bug fixes:
1. Analyze the user's intent, select appropriate TDesign components, and plan WXML/WXSS/JS/JSON structure
2. Identify potential pitfalls (component layer penetration, form validation, async state updates)
3. Provide complete, separated code blocks (JSON, WXML, JS, WXSS) with Chinese comments
4. Include key caveats and gotchas for the approach taken

## Project Overview

**chiyaole** (吃药了) - WeChat Mini Program for medication management/reminders.
Editorial "Living Sanctuary" design philosophy - premium wellness magazine aesthetic, not clinical coldness.

- **Platform:** Native WeChat Mini Program (WXML/WXSS/JS/JSON)
- **UI Framework:** tdesign-miniprogram ^1.13.0
- **Architecture:** Front-end only (local storage via `wx.getStorageSync`), will integrate `wx.request` backend later
- **No cloud development** (no cloud functions, cloud DB, cloud hosting)
- **AppID:** wx84a0172595b38012
- **Base Library:** 3.0.0

## Development Setup

```bash
npm install
# Then in WeChat DevTools: Tools -> Build npm (required after every npm install/update)
```

No test runner, linter, or build scripts are configured. Development and preview are done entirely in WeChat DevTools.

## WeChat Mini Program Constraints

- **No `*` selector in WXSS** - use explicit element list: `view, text, image { }`
- **No external font `@import url()`** - use system fonts or `wx.loadFontFace()` in JS
- **No DOM access** - all updates via `this.setData()`
- **Storage:** `wx.getStorageSync()` / `wx.setStorageSync()`, not `localStorage`
- **Network:** `wx.request()` with domain whitelist configured in backend
- **Navigation:** TabBar pages use `wx.switchTab()`, non-TabBar pages use `wx.navigateTo()`
- **Page registration:** every page must be in `app.json` `pages` array
- **Page files:** each page requires 4 files: `.js`, `.json`, `.wxml`, `.wxss`
- **Components:** must declare in page `.json` `usingComponents` (or globally in `app.json`)
- **NPM:** must run "Tools -> Build npm" in WeChat DevTools after `npm install`; packages resolve from `miniprogram_npm/`

## TDesign Usage Rules

1. **Always prefer TDesign components** and their native API (Props, Events, Slots, CSS Variables, externalClasses) over custom implementations
2. **Style overrides:** use TDesign CSS Variables or externalClasses - global overrides are in `app.wxss` (`--td-brand-color`, etc.)
3. **Global components** already registered in `app.json`: t-icon, t-input, t-textarea, t-stepper, t-picker, t-picker-item
4. **Adding new TDesign components:** register in `app.json` (global) or page `.json` (local) `usingComponents`

## Architecture

### Tab Pages & Custom TabBar

The app uses a **custom TabBar** (`custom-tab-bar/`) built with TDesign `t-tab-bar` + `t-tab-bar-item`. Tab state is value-based (string, not index).

| Value | Label | Icon | Page Path |
|-------|-------|------|-----------|
| `'index'` | 今日提醒 | home | pages/index/index |
| `'record'` | 吃药记录 | calendar | pages/record/record |
| `'medication'` | 药品管理 | pill | pages/medication/list |
| `'user'` | 个人中心 | user | pages/user/user |

Each tab page must sync TabBar state in `onShow()`:
```javascript
onShow() {
  if (typeof this.getTabBar === 'function' && this.getTabBar()) {
    this.getTabBar().setData({ value: 'index' }) // use correct value string
  }
}
```

### Page Map

- `pages/index/index` - Home: daily medication progress, today's medication list, quick check-in
- `pages/record/record` - Records: calendar view, medication history, compliance stats
- `pages/medication/list` - Medication list: grid layout, stock levels, low-stock alerts
- `pages/medication/add` - Add medication form: name, dosage, frequency, stock management
- `pages/user/user` - Profile: user info, settings navigation

### Data Flow

Currently using **hardcoded mock data** in each page's `data` object. Future backend integration will replace these with `wx.request()` calls in `onLoad()` / `onShow()`.

### Global Styles (app.wxss)

All design tokens are CSS variables on `page` selector. Key utility classes:

- **Cards:** `.card`, `.card-elevated` (no borders, tonal layering)
- **Buttons:** `.btn-primary` (blue gradient), `.btn-checkin` (green gradient, scale(0.98) on tap)
- **Surfaces:** `.bg-surface`, `.bg-surface-container`, `.bg-surface-container-lowest`
- **Typography:** `.text-headline-lg`(64rpx), `.text-headline-md`(48rpx), `.text-body-md`(28rpx), `.text-label-md`(24rpx)
- **Spacing:** `.p-4`, `.p-5`, `.px-4`, `.gap-4`, `.gap-8`
- **Radius:** `.rounded-sm`(8rpx), `.rounded-md`(12rpx), `.rounded-lg`(16rpx), `.rounded-full`

## Design System: The Serene Healer

### Core Rules
- **No 1px borders for sectioning** - use background color shifts only
- **No grey/black shadows** - use brand-tinted ambient shadows: `rgba(0, 88, 188, 0.08)`
- **Tonal layering** over drop shadows: surface(#f9f9fe) -> surface-container(#ededf2) -> white cards(#ffffff)

### Color Intent
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #0058bc -> #0070eb | Main CTAs, medical precision |
| Secondary Green | #006e28 -> #6ffb85 | Check-in, health progress |
| Tertiary Purple | #4c4aca | Educational chips, insights |
| Surface | #f9f9fe | Page background |

### Performance Guidelines
- Minimize `setData` payload size - avoid sending large unchanged data
- Use `lazyCodeLoading` when available
- Handle iOS safe area with `env(safe-area-inset-bottom)` / `constant(safe-area-inset-bottom)`

## Packaging

`project.config.json` `packOptions.ignore` excludes: `DESIGN.md`, `CLAUDE.md`, `.git/`. Add new non-packaged files there.
