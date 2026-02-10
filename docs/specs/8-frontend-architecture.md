# 8. Frontend Architecture

## Route Structure

| Route                    | Component                 | Description             |
| ------------------------ | ------------------------- | ----------------------- |
| `/`                      | index.tsx                 | Landing / Dashboard     |
| `/login`                 | login.tsx                 | Login form + Google Sign-In |
| `/register`              | register.tsx              | Registration form       |
| `/decisions`             | decisions/index.tsx       | Decision list           |
| `/decisions/new`         | decisions/new.tsx         | Create decision         |
| `/decisions/:id`         | decisions/$id/index.tsx   | View/Edit decision      |
| `/decisions/:id/history` | decisions/$id/history.tsx | Confidence timeline     |
| `/decisions/:id/review`  | decisions/$id/review.tsx  | Add/View reviews        |
| `/patterns`              | patterns.tsx              | Cross-decision analysis |

## Server Functions vs API Calls

| Use Server Functions      | Use API Calls      |
| ------------------------- | ------------------ |
| Initial page data loading | Real-time updates  |
| Form submissions          | Background sync    |
| Auth-dependent queries    | Optimistic updates |
| SEO-critical content      | Polling            |

## State Management

| State Type   | Solution        |
| ------------ | --------------- |
| Server State | TanStack Query  |
| Auth State   | React Context   |
| UI State     | React Context   |
| URL State    | TanStack Router |

## Login UI Contract

- Local login: email + password form submits to `POST /api/auth/login`
- Google login: Google Identity button gets `idToken`, then submits to `POST /api/auth/google`
- Both login methods finish by storing `accessToken` in auth context and relying on `refresh_token` HttpOnly cookie for renewal
