# Code Conventions

## File Naming

kebab-case for all files (e.g., `auth-service.ts`, `practice-header.tsx`).

## UI Components

- Always prefer shadcn. Only custom-build when shadcn has no match; document rationale in PR.
- **Shadcn-first rule (mandatory)**: For interactive UI controls, first use context7 to search for Shadcn existing components (e.g., via `npx shadcn add`) before building a new one.
  For buttons specifically, use `@/components/ui/button` (`<Button />`) instead of raw `<button>` unless there is a documented technical exception.

## Styling

- Tailwind CSS v4 + CVA + clsx + tailwind-merge
- **Color token reuse (mandatory)**: Define reusable colors as tokens (e.g., CSS variables in `styles.css` / `@theme`) and consume those tokens/utilities across components. Avoid ad-hoc hardcoded color values in component files.

## Validation

Zod for all input validation (shared schemas in `packages/shared`).

## Immutability

Always create new objects, never mutate.
