# 4. API Design

## Authentication Endpoints

| Method | Endpoint             | Description                           | Auth Required                               |
| ------ | -------------------- | ------------------------------------- | ------------------------------------------- |
| POST   | `/api/auth/register` | Create new account                    | No                                          |
| POST   | `/api/auth/login`    | Login with email/password             | No                                          |
| POST   | `/api/auth/google`   | Login/Register via Google idToken     | No                                          |
| POST   | `/api/auth/refresh`  | Rotate refresh token, issue access    | No (requires valid `refresh_token` cookie)  |
| POST   | `/api/auth/logout`   | Revoke refresh token and clear cookie | No (requires `refresh_token` cookie)        |
| GET    | `/api/auth/me`       | Get current user info                 | Yes (`Authorization: Bearer <accessToken>`) |

## Auth Token Contract

- Access token: returned in JSON response body (`accessToken`), expires in 15m
- Refresh token: set as `HttpOnly + Secure + SameSite=Strict` cookie (`refresh_token`), expires in 30d
- `POST /api/auth/google`: request body `{ idToken: string }`
- `POST /api/auth/refresh`: always performs token rotation (old refresh token revoked, new one issued)
- Reuse detection: if revoked/replaced refresh token is reused, revoke full token family and return `401`

## Decision Endpoints

| Method | Endpoint                     | Description               | State Constraint |
| ------ | ---------------------------- | ------------------------- | ---------------- |
| GET    | `/api/decisions`             | List user's decisions     | -                |
| POST   | `/api/decisions`             | Create new decision       | -                |
| GET    | `/api/decisions/:id`         | Get decision with details | Owner only       |
| PATCH  | `/api/decisions/:id`         | Update decision fields    | **DRAFT only**   |
| POST   | `/api/decisions/:id/freeze`  | Freeze decision           | **DRAFT only**   |
| POST   | `/api/decisions/:id/close`   | Close decision            | **ACTIVE only**  |
| GET    | `/api/decisions/:id/history` | Get change history        | Owner only       |

## Hypothesis Endpoints

| Method | Endpoint                         | Description               | State Constraint |
| ------ | -------------------------------- | ------------------------- | ---------------- |
| POST   | `/api/decisions/:id/hypotheses`  | Add hypothesis            | **DRAFT only**   |
| PATCH  | `/api/hypotheses/:id`            | Update hypothesis content | **DRAFT only**   |
| DELETE | `/api/hypotheses/:id`            | Delete hypothesis         | **DRAFT only**   |
| POST   | `/api/hypotheses/:id/confidence` | Adjust confidence         | **DRAFT only**   |
| GET    | `/api/hypotheses/:id/history`    | Get confidence history    | Owner only       |

## Evidence Endpoints

| Method | Endpoint                      | Description       | State Constraint |
| ------ | ----------------------------- | ----------------- | ---------------- |
| POST   | `/api/decisions/:id/evidence` | Add evidence      | DRAFT or ACTIVE  |
| GET    | `/api/decisions/:id/evidence` | List all evidence | Owner only       |

## Review Endpoints

| Method | Endpoint                     | Description      | State Constraint     |
| ------ | ---------------------------- | ---------------- | -------------------- |
| POST   | `/api/decisions/:id/reviews` | Add review       | **ACTIVE or CLOSED** |
| GET    | `/api/decisions/:id/reviews` | List all reviews | Owner only           |

## Pattern Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/api/patterns/summary` | Get cross-decision statistics |

## Error Codes

| HTTP Code | Scenario                       |
| --------- | ------------------------------ |
| 400       | Validation error (Zod)         |
| 401       | Not authenticated              |
| 403       | Not authorized (not owner)     |
| 404       | Resource not found             |
| 409       | Invalid state transition       |
| 429       | Too many requests (rate limit) |
