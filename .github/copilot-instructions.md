# Copilot instructions

## Project conventions

- This is a Next.js App Router application using React, TypeScript, Vanilla Extract, and a shared theme in `src/theme`.
- Follow `eslint.config.ts` and the existing project patterns; run `yarn lint` and the relevant type/build check after code changes.
- Use the `@/*` alias for `src/*` and `@/ui` for shared theme components.
- Prefer server components. Fetch initial page data in `page.tsx` or another server component and pass serializable props to client components. Add `"use client"` only for state, effects, event handlers, or browser-only libraries.
- Use server actions for mutations when appropriate. Keep route handlers for HTTP APIs and external integrations.
- Use named exports for reusable components and keep component files, styles, types, and barrel exports together under `src/components/<Component>/`.
- Name the root style export for a component `wrapperClass`; give additional style exports descriptive names.
- When passing local values as component props, use object spread shorthand (for example, `<Sidebar {...{ loads }} />`) instead of enumerating them (for example, `<Sidebar loads={loads} />`). Spread an entity directly when forwarding it unchanged.
- Destructure object fields when mapping or consuming records where practical, and use property shorthand when the local name matches the key.
- When transforming only a few fields, destructure those fields and spread the rest (for example, convert selected `Date` fields to ISO strings, then include `...restLoad`) instead of re-enumerating unchanged properties.
- Keep types strict and reuse existing domain types instead of duplicating their shapes. Follow the established `T` prefix for newly named types.
- Use separate `import type` statements for type-only imports when consistent with nearby code.

## UI and styling

- Define component styles with Vanilla Extract and the shared theme. Use the existing palette and font tokens; do not introduce unrelated hard-coded colors or font families.
- Prefer flexbox over CSS Grid for layout unless Grid is clearly the simpler fit.
- Use mobile-first responsive styles: make the base styles fit narrow screens, then enhance them at wider sizes. Use only breakpoints from `src/theme/variables/devices.ts` through `style(({ devices }) => ...)`; do not add ad hoc media-query widths.
- Use the shared `Button`, `Input`, and `Spinner` from `@/ui` instead of native controls or text-only loading indicators when their component type applies.
- Use `div` and `span` for page layout instead of HTML5 landmark/container tags such as `main`, `section`, `header`, `footer`, and `aside`. Do not add ARIA attributes. Keep interactive elements native through the shared `Button` and `Input` components.
- Use readable text sizes and maintain visible focus, disabled, and loading states.
- Prefer the project’s existing icons and helpers over duplicating them.

## React and TypeScript

- Keep client state local unless it must be shared between components.
- Avoid adding effects for data that can be fetched on the server or derived during render.
- Use `useMemo` and `useCallback` only when there is a concrete performance or referential-stability need.
- Handle loading, empty, and error states explicitly. Do not silently hide failed requests.
- Use descriptive event parameter names and read form values from the correct event target.
- Avoid `any`, unnecessary type assertions, broad exception catches, and `eslint-disable` comments.

## App structure

- Route entry points and server actions live under `src/app`.
- Shared UI lives under `src/components`; reusable controls and design tokens live under `src/theme`.
- Database schemas and access live under `src/db`; domain logic lives under `src/services`.
- Use the Zustand store in `src/store` and its `useStore` hook in `src/hooks` for shared client state.
- Keep database access on the server and pass only the fields needed by client components.
