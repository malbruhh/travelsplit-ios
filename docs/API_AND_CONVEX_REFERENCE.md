# API & Convex Real-Time Serverless Reference

## 1. Express REST API Endpoints

Base URL (Local): `http://localhost:5000/api`

### Trips API
| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips` | List all trips | None | `Trip[]` |
| `GET` | `/trips/code/:joinCode` | Lookup trip by 6-char code | `:joinCode` (e.g. `SAKURA`) | `Trip` |
| `POST` | `/trips` | Create new trip | `{ name, destination, baseCurrency, startDate, endDate, createdBy, members }` | `Trip` (with auto-generated join code) |
| `POST` | `/trips/join` | Join trip with code | `{ joinCode: "SAKURA", user: { id, name, email, avatarColor } }` | `Trip` |
| `PUT` | `/trips/:id` | Update trip metadata/members | `Partial<Trip>` | Updated `Trip` |
| `DELETE` | `/trips/:id` | Cascade delete trip | `:id` | `{ success: true }` |

### Expenses API
| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/expenses/trip/:tripId` | Get all expenses for trip | `:tripId` | `Expense[]` |
| `POST` | `/expenses` | Create new expense | `Expense` object | `Expense` (201 Created) |
| `PUT` | `/expenses/:id` | Update existing expense | `Partial<Expense>` | Updated `Expense` |
| `DELETE` | `/expenses/:id` | Delete expense | `:id` | `{ success: true }` |

### Settlements API
| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/settlements/trip/:tripId` | Get settlements for trip | `:tripId` | `Settlement[]` |
| `POST` | `/settlements` | Record settlement payment | `{ tripId, fromUserId, toUserId, amount, currency, paymentMethod, date, notes }` | `Settlement` |
| `DELETE` | `/settlements/:id` | Delete settlement | `:id` | `{ success: true }` |

### Full-State Sync API
| Method | Endpoint | Description | Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/sync/:tripId` | Returns all trip data, expenses, settlements, and audit logs | `{ trip, expenses, settlements, auditLogs, serverTime }` |

---

## 2. Convex Real-Time Serverless Functions

### Schema Tables (`convex/schema.ts`):
- `trips` (indexed by `joinCode`)
- `expenses` (indexed by `tripId`)
- `settlements` (indexed by `tripId`)
- `users` (indexed by `email`)
- `auditLogs` (indexed by `tripId`)

### Serverless Functions:
- `trips:getTrips` (Query)
- `trips:getTripByJoinCode` (Query)
- `trips:createTrip` (Mutation)
- `trips:joinTrip` (Mutation)
- `expenses:getExpensesByTrip` (Query)
- `expenses:createExpense` (Mutation)
- `expenses:deleteExpense` (Mutation)
- `settlements:getSettlementsByTrip` (Query)
- `settlements:createSettlement` (Mutation)
- `settlements:deleteSettlement` (Mutation)
