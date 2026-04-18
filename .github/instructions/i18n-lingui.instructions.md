---
applyTo: "**/*.{ts,tsx}"
---

# Internationalization (i18n) with Lingui — Standards & Best Practices

This document defines how to implement and maintain i18n using Lingui in this project.

## Core Principles

- Use the split Lingui v5 macro entry points:
  - React (JSX) macros from `@lingui/react/macro` (`Trans`, `Plural`, `Select`, `useLingui`).
  - Core (JS) macros from `@lingui/core/macro` (`t`, `plural`, `select`, `defineMessage`/`msg`).
- Use `<Trans>` for JSX text, and `t`/`plural` for programmatic strings (toasts, aria, logs).
- Do NOT wrap `t` output in `i18n._`. The `t` macro returns a translated string. Use `i18n._` only with `msg`/`defineMessage` descriptors or when not using macros.
- Avoid string concatenation; use variables in message templates instead.
- Keep messages short, human-readable, and context-aware.
- Never duplicate providers: the single `I18nProvider` lives inside the Direction provider.
 - Don’t call Core macros at module (top) level; call them inside functions/components so they re-run on locale change. Use `defineMessage/msg` for lazy translations if needed.

## Project Integration

- Provider: `I18nProvider` is mounted in [src/context/direction-provider.tsx](../../src/context/direction-provider.tsx) and MUST NOT be added elsewhere.
- Locale management: use helpers from [src/lib/i18n.ts](../../src/lib/i18n.ts)
  - `loadAndActivateLocale(locale)` to switch locale at runtime
  - `initializeI18n()` to load the preferred/default locale on startup
  - Supported locales are defined in `locales` and must be kept in sync with [lingui.config.ts](../../lingui.config.ts)
- Direction: RTL/LTR is auto-derived from locale (e.g., `ur`, `ar` → RTL) via the Direction provider.

## Authoring Translations

### JSX Content

```tsx
import { Trans } from "@lingui/react/macro";

function Title() {
  return <h1><Trans>Account Settings</Trans></h1>;
}
```

### Programmatic Strings

Preferred: use Core macros and/or the `useLingui` React macro.

```tsx
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";

function saveSuccessToast() {
  const { t } = useLingui();
  // show toast with translated string
  toast.success(t`Saved successfully`);
}
```

Lazy translations (define once, translate later):

```tsx
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react"; // runtime hook for i18n._

const savedMsg = msg`Saved successfully`;

function saveSuccessToast() {
  const { i18n } = useLingui();
  toast.success(i18n._(savedMsg));
}
```

### Plurals / Select

JSX UI:

```tsx
import { Plural, Select, Trans } from "@lingui/react/macro";

function Summary({ count, status }: { count: number; status: "open"|"closed" }) {
  return (
    <p>
      <Plural
        value={count}
        zero={<Trans>No items</Trans>}
        one={<Trans>1 item</Trans>}
        other={<Trans>{count} items</Trans>}
      />
      {" · "}
      <Select
        value={status}
        open={<Trans>Open</Trans>}
        closed={<Trans>Closed</Trans>}
        other={<Trans>Unknown</Trans>}
      />
    </p>
  );
}
```

Programmatic strings (toasts, metadata):

```tsx
import { t, plural, select } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";

function printToast(count: number) {
  const { t } = useLingui();
  toast.success(
    t`Sent ${plural(count, { one: "# item", other: "# items" })} to printer`
  );
}
```

### Attributes & ARIA

- Prefer Core `t` for attributes; `Trans` for element content.

```tsx
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react/macro";

function IconButton() {
  const { t } = useLingui();
  return (
    <button aria-label={t`Close dialog`}>
      <span className="sr-only"><Trans>Close dialog</Trans></span>
      ×
    </button>
  );
}
```

## Locale & Catalog Workflow

- Add a locale:
  1) Update `locales` in [src/lib/i18n.ts](../../src/lib/i18n.ts)
  2) Add the locale code to `locales` in [lingui.config.ts](../../lingui.config.ts)
  3) Create `src/locales/<locale>/messages.po`
- Extract & compile messages:

```bash
pnpm run i18n:extract
pnpm run i18n:compile
```

- Do not edit compiled output manually.

## UI Patterns

- Language switcher: use the context from the Direction provider (`useLingui`) to call `setLocale(locale)`. See example component [src/components/language-switch.tsx](../../src/components/language-switch.tsx).
- Do not mount an extra `I18nProvider` anywhere else.
- Direction will automatically update on locale change; avoid manual `dir` toggles.

## Routing, Code-Splitting & Vite

- Use macros from the split v5 packages in all route components:
  - `@lingui/react/macro` for JSX
  - `@lingui/core/macro` for JS strings
- PO files are included in the app’s assets (PWA caching is configured to include `.po`).

## Do & Don’t

- Do: `<Trans>Label</Trans>` for JSX text.
- Do: `t` and `plural` for programmatic strings (no `i18n._` around `t`).
- Don’t: concatenate strings or build IDs dynamically.
- Don’t: wrap the app with another `I18nProvider` outside the Direction provider.
- Don’t: call Core macros at module level; keep them inside functions/components.

## Quality & Testing

- Verify that strings appear in the extracted catalog before merging PRs.
- Switch to all supported locales and spot-check critical flows.
- Ensure ARIA labels and placeholders are localized.

## Commands

```bash
# Extract messages from source
pnpm run i18n:extract

# Compile catalogs for runtime
pnpm run i18n:compile

# Shortcut: extract + compile
pnpm run i18n
```
