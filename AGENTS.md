# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

**chiyaole** (吃药了) is a native WeChat Mini Program for medication management. It uses `tdesign-miniprogram` as its only npm dependency. There is no backend — all data is local storage (`wx.getStorageSync` / `wx.setStorageSync`). See `CLAUDE.md` for full architecture details.

### Runtime environment

WeChat Mini Programs can **only** be compiled and previewed in [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) (macOS/Windows GUI). There is no headless mode, no CLI simulator, and no Docker image. On a Linux Cloud Agent VM, the app cannot be visually run.

### What you CAN do on a Linux VM

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Validate JSON syntax | `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8'))"` |
| Validate JS syntax | `node --check <file.js>` |
| Exercise service layer | Mock `global.wx` storage APIs, then `require()` the utils — see `CLAUDE.md` for patterns |

### Key gotchas

- **No linter / test runner / build scripts** are configured in `package.json`. The `test` script just echoes an error. All development preview is done in WeChat DevTools.
- After `npm install`, the `miniprogram_npm/` directory does **not** exist until "Tools → Build npm" is run inside WeChat DevTools. On a Linux VM this step cannot be performed; components resolve from `node_modules/tdesign-miniprogram/miniprogram_dist/` at compile time in DevTools.
- TDesign component paths in `app.json` → `usingComponents` use the format `tdesign-miniprogram/button/button`. DevTools resolves these after "Build npm".
- All JS files use CommonJS (`require` / `module.exports`). They reference `wx.*` globals that only exist in the Mini Program runtime. To run them in Node.js you must provide a `global.wx` mock.
- Page files always come in sets of 4: `.js`, `.json`, `.wxml`, `.wxss`. All pages must be listed in `app.json` `pages` array.

### Recommended validation workflow for Cloud Agents

1. `npm install` — fetch `tdesign-miniprogram`
2. Verify all page file sets exist (4 files per page listed in `app.json`)
3. `node --check` on every `.js` file — catches syntax errors
4. Parse-validate every `.json` file with `JSON.parse()`
5. (Optional) Create a temporary script that mocks `global.wx` storage and exercises the service layer (`utils/storage.js`, `utils/medicationService.js`, `utils/checkinService.js`, `utils/userService.js`)
