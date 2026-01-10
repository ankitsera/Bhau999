# API summary (changed endpoints)

This document lists the important API endpoints and highlights recent changes in request/response shapes.

Bet APIs
- POST /api/bet
  - Accepts an array of bets in the request body. Each bet should contain:
    - mobileNumber (string)
    - gameName (string)
    - type (string)
    - amount (integer)
    - betValue (integer)
    - openClose (string, optional)
  - Server behavior: sets `bet_time` to current server datetime automatically when creating bets and records a transaction with `initiator` set to "Bet placed".
  - Response: { message: "Bets placed", bets: [ ...saved bets... ] }

- GET /api/bets
  - Returns active bets. Response shape only contains scalar bet fields (id, mobileNumber, gameName, type, amount, betValue, openClose, betTime, result) to avoid triggering lazy loads.

- GET /api/bet-history
  - Returns archived bets (same scalar shape as /api/bets). Uses `bets_history` data.

- GET /api/bets/user/{mobileNumber}
  - Returns combined bets (active + history) for a mobile number. Response uses scalar bet fields.

- GET /api/bets/game/{gameName}
  - Returns bets for a game from the active `bets` table.

- GET /api/bets/game/{gameName}/all
  - Returns bets for a game from both active `bets` and `bets_history`.

Game APIs
- POST /api/game
  - Create or update a game. Request body should include:
    - name (string) — required
    - open_time (string, optional) — format "HH:mm[:ss]" or use camelCase openTime
    - close_time (string, optional) — format "HH:mm[:ss]" or use camelCase closeTime
  - The controller normalizes `name` to upper-case, and parses `open_time` / `close_time` into TIME.

- GET /api/game
  - List all games. Returns `name`, `openTime`, `closeTime` fields.

Transactions
- New columns: `initiator`, `status`, `remarks` were added to the `transactions` table and are available in the Transaction API responses.

Notes
- Listing endpoints now map Bet entities to a scalar-only response (no nested `user`, `game` or `rate` objects) to prevent lazy-loading JPA relations during JSON serialization.
# API Reference — Backend

This document lists the REST APIs provided by the backend and how to use them. It includes request/response examples and validation notes to help the frontend developer integrate with the server.

Base URL
- When running locally (default): `http://localhost:8080`

Security
- Development mode: all endpoints are open (no authentication enforced). The project currently permits all requests for easier development; add authentication later before production by updating `SecurityConfig.java`.

Content type
- All endpoints accept/return JSON. Set `Content-Type: application/json`.

Table of contents
- Authentication
- Users
- Games
- Rates
- Transactions
- Bets

---

## Authentication (public)

### POST /api/auth/signup
- Purpose: Register a new user.
- Request JSON:

```
{
  "mobileNumber": "9876543210",   // required, exactly 10 digits
  "username": "alice",            // optional
  "password": "plaintext"        // required
}
```

- Behavior:
  - Validates `mobileNumber` is exactly 10 digits.
  - Stores `password` as provided (plain text) — NOT RECOMMENDED for production.
  - Sets `dateSignup` to server time.
  - `mobileNumber` is the user's primary key in DB.

- Responses:
  - 200 OK: `"Signup successful"`
  - 400 Bad Request: `{code: "INVALID_MOBILE", message: ...}` or `{code: "MOBILE_EXISTS", message: ...}`

### POST /api/auth/login
- Purpose: Login by mobile number and password.
- Request JSON:

```
{
  "mobileNumber": "9876543210",
  "password": "plaintext"
}
```

- Response:
  - 200 OK: returns user details (sanitized, no password):

```
{
  "mobileNumber": "9876543210",
  "username": "alice",
  "dateSignup": "2025-11-08T12:34:56",
  "balance": 1500,
  "accountNumber": "XXXXXXXX1234",
  "ifscCode": "ABCD0123456",
  "upiId": "alice@upi"
}
```

  - 401 Unauthorized: `"Invalid credentials"`

### POST /api/auth/checkUser
- Purpose: Check whether a mobile number is registered.
- Request JSON (use `mobileNumber`):

```
{ "mobileNumber": "9876543210" }
```

- Response:
  - 200 OK: `{ status: "NEW", message: "Mobile not registered" }` or `{ status: "EXISTS", message: "User exists" }`
  - 400 Bad Request: invalid mobile format `{ code: "INVALID_MOBILE", message: ... }`

---

## Games

Notes: `Game.name` is the primary key (string). API normalizes names to uppercase before any DB operation to avoid duplicates.

### POST /api/game
- Purpose: Create or update a game.
- Request JSON:

```
{
  "name": "Evening Game",      // required — will be normalized to uppercase
  "openTime": "18:00:00",     // optional, format HH:mm or HH:mm:ss
  "closeTime": "21:00:00"     // optional
}
```

- Behavior:
  - Trims and uppercases `name` before saving.
  - If a Game with the same (uppercased) `name` exists, it will be updated; otherwise created.

- Response:
  - 200 OK: returns the saved Game JSON (name, openTime, closeTime).
  - 400 Bad Request: missing name or invalid payload.

### DELETE /api/game/{name}
- Purpose: Delete a game by name. `{name}` will be normalized to uppercase.
- Response:
  - 200 OK: `{ deleted: "NAME" }` on success
  - 404 Not Found: `"Game not found"`

### GET /api/game
- Purpose: List all games.
- Response: 200 OK — array of game objects.

---

## Rates

Notes: `Rate.type` is the primary key (string).

### POST /api/rate
- Purpose: Create or update a rate.
- Request JSON:

```
{
  "type": "SINGLE",   // required (PK)
  "rate": 2.5           // required (double)
}
```

- Response: 200 OK — saved Rate object.

### DELETE /api/rate/{type}
- Purpose: Delete a rate by type.
- Response: 200 OK `{ deleted: "SINGLE" }` or 404 if not found.

### GET /api/rate
- Purpose: List all rates.
- Response: 200 OK — array of rate objects.

---

## Transactions

### POST /api/transaction
- Purpose: Create a transaction record (credit/debit, etc.).
- Request JSON:

```
{
  "mobileNumber": "9876543210",  // required, must exist
  "amount": 500,                  // required
  // optional: txDate (YYYY-MM-DD), txTime (HH:mm:ss)
}
```

- Behavior:
  - Validates the `mobileNumber` exists. Returns 404 if user not found.
  - If `txDate`/`txTime` absent, server fills with current date/time.
  - IMPORTANT: creating a transaction updates the user's balance by adding the `amount` (amount may be negative for withdrawals). The balance is adjusted atomically when the transaction is recorded.

 - Response: 200 OK — the saved transaction object (with generated `id`).

Also: when crediting a user's balance (e.g., on a win), prefer using the Balance API below which both updates the balance and records a transaction.
---

## Bets

### POST /api/bet
- Purpose: Create a bet.
- Request JSON:

```
{
  "mobileNumber": "9876543210",   // required
  "gameName": "Evening Game",     // required (will be normalized to uppercase)
  "type": "SINGLE",               // required — must exist in rates
  "amount": 100,                    // required
  // optional: betDate (YYYY-MM-DD)
}
```

- Behavior:
  - Normalizes `gameName` to uppercase and checks that the Game exists.
  - Validates the user exists (mobileNumber) and the rate/type exists.
  - If `betDate` missing, server sets it to today.
  - When a bet is placed, the bet `amount` is deducted from the user's balance atomically. If the user does not have sufficient balance the API returns 400 `Insufficient balance` and the bet is not recorded.
  - A negative transaction record is created for the bet (so the ledger reflects the deduction).

- Response: 200 OK — saved Bet object (with generated `id`).
  - 404 Not Found if user, game or rate is missing.

---

## Balance / Credits

### POST /api/balance/add
- Purpose: Credit a user's balance (used when the user wins a bet or receives funds).
- Request JSON (reuses Transaction shape):

```
{
  "mobileNumber": "9876543210",
  "amount": 500,
  // optional: txDate, txTime
}
```

- Behavior:
  - Validates the user exists.
  - Adds `amount` to the user's balance and records a transaction with the given amount.

- Response: 200 OK — returns the updated User object (including new `balance`).

---

## Error handling and validation notes
- The API returns plain strings for some error paths (e.g., `"Invalid credentials"`) and structured JSON maps for validation errors. Frontend should handle both.
- `mobileNumber` must be exactly 10 digits.
- `gameName` is uppercased before lookups/saves — the frontend may send any case but will receive uppercase values from the server.
