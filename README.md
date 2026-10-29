## Tool Sharing:
A full-stack peer-to-peer tool rental platform where users can list tools, rent tools from other users, and manage their rental lifecycle.

Built with Next.js, Node.js, Express, and MongoDB, with JWT authentication, transactional rental operations, concurrency-safe reservations, and automated integration testing.

## Live Demo:
- Frontend: https://toolsharing.vercel.app
- Backend: https://tool-sharing.onrender.com

## Screenshots:
### Landing Page
![Landing Page](screenshots/LandingPage.png)

### Browse Tools
![Browse Tools](screenshots/BrowseTools.png)

### Add Tool
![Add Tool](screenshots/AddTool.png)

### My Rentals
![My Rentals](screenshots/Rentals.png)

## Features:
- Peer-to-peer marketplace — Users can list their own tools and rent tools from other users.
- Secure authentication — JWT-based authentication with protected API routes.
- Rental lifecycle management — Start and end rentals with automatic cost calculation.
- Concurrency-safe rentals — Atomic database updates prevent multiple users from renting the same tool simultaneously.
- Transactional consistency — MongoDB transactions keep tool availability and rental records synchronized.
- Input validation & security — Zod validation and Helmet security headers.
- Pagination & filtering — Efficient browsing of available tools.
- Persistent authentication — Users remain authenticated across sessions.
- Soft deletion — Deleted tools are preserved for historical rental integrity.
- Automated testing — 37 integration tests covering authentication, tools, rentals, authorization, validation, and concurrency scenarios.
- Continuous Integration — GitHub Actions automatically runs the test suite on every push to main.
- Performance benchmarking — API throughput, latency, database scalability, rental concurrency, and stress behavior are measured.
  
## Testing & CI

The backend includes 37 integration tests covering:

- User registration and authentication
- Protected routes and authorization
- Tool creation and management
- Rental lifecycle
- Invalid input and IDs
- Rental ownership rules
- Concurrent rental attempts
- Pagination and filtering
- Transaction rollback during rental creation
- Transaction rollback during rental completion

Tests are automatically executed through GitHub Actions whenever changes are pushed to main.
```
Test Suites: 4 passed, 4 total
Tests:       38 passed, 38 total
```
### Code Coverage

|# |Metric | Coverage |
|-- | ---- | -------- |
|1| Statements | 93.33% |
|2| Branches | 87.80% |
|3| Functions | 94.44% |
|4| Lines | 93.61% | 

### CI Pipeline
```text
Push to main
     │
     ▼
GitHub Actions
     │
     ▼
Node.js 22
     │
     ▼
npm ci
     │
     ▼
npm test
     │
     ▼
37 / 37 tests passed ✓
``` 

## Performance Benchmarks

The backend contains dedicated benchmark programs for measuring behavior under load.
```
server/benchmark/ 
├── health.js 
├── api.js 
├── rental.js 
├── db.js 
└── stress.js
```
### Health Endpoint

1,000 requests:

|# |Metric |Result |
|--| ------| ------| 
|1 |Successful	|1,000 |
|2 |Failed |0 |
|3 |Throughput	|3,463.67 req/s |
|4 |Average |13.23 ms |
|5 |p50	|11.72 ms |
|6 |p95 |	17.27 ms |
|7 |p99	| 37.39 ms |

### Rental Concurrency

50 concurrent rental requests against independent tools:

|# |Metric |Result |
|--| ------| ------| 
|1 |Requests |50 |
|2 |Successful	|50 |
|3 |Failed |0 |
|4 |Throughput	|21.92 req/s |
|5 |Average |1456.32 ms |
|6 |p50 |1415.27 ms |
|7 |p95 |2217.76 ms |
|8 |p99 |2276.42 ms |

### API Load Test

500 requests per endpoint at concurrency 25:

|# |Endpoint |Throughput |Average |p95 |Success |
|--| ------| ------| ----- | ----- | ---- | 
|1 |GET |`/api/tools` |36.06 req/s	|690 ms |991 ms |100% |
|2 |GET |` /api/rentals/myrentals` |37.71 req/s |646 ms |976 ms |100% |
|3 |POST |`/api/tools` |56.87 req/s |437 ms |927 ms |100% |

### Database Scalability

The database benchmark populated MongoDB with 5,000 tool documents and tested paginated and filtered queries.

|# |Query |Throughput |Average |p95 |
|--| ------| ------| ----| ----|
|1 |Page 1 |37.69 req/s |258 ms |810 ms |
|2 |Page 100 |33.86 req/s |291 ms |823 ms |
|3 |Page 500 |33.80 req/s |294 ms |826 ms |
|4 |Location filter |34.45 req/s |281 ms |817 ms |
|5 |Price filter |44.98 req/s |219 ms |775 ms |

### Concurrency Stress Test

500 requests were executed at each concurrency level:

|# |Concurrency |Success Rate	|Throughput |Average |p95 |p99 |
|--| ------| ------|-------| -----| -----| ----|
|1 |10 |100% |35.24 req/s |283 ms |827 ms |934 ms |
|2 |25 |100% |38.44 req/s |649 ms |975 ms |1945 ms |
|3 |50 |100% |40.99 req/s |1178 ms |1936 ms |2074 ms |
|4 |100 |100% |44.18 req/s |2182 ms |2957 ms |3934 ms |

The stress test maintained a 100% success rate at all tested concurrency levels, while latency increased as concurrency increased.

These results characterize the backend's behavior under the tested local workload rather than representing production-scale capacity.

## Tech Stack:

|# | Layer | Technologies |
|----- | ----- | ------------ |
|1 |Frontend| Next.js , React , Tailwind CSS ,Axios|
|2 |Backend | Node.js, Express.js|          
|3 |Database|MongoDB, Mongoose |
|4 |Authentication|	JWT |
|5 |Validation|	Zod|
|6 |Security|Helmet|
|7 |Testing|Jest, Supertest|
|8 |CI/CD|GitHub Actions|
|9 |Deployment|Vercel, Render|

## Architecture:

```text
┌─────────────────────┐
│   Next.js Frontend  │
│  React + Tailwind   │
└──────────┬──────────┘
           │ REST / HTTP
           ▼
┌─────────────────────┐
│    Express API      │
│                     │
│ JWT │ Zod │ Helmet  │
└──────────┬──────────┘
           │ Mongoose
           ▼
┌─────────────────────┐
│       MongoDB       │
│                     │
│ Transactions        │
│ Atomic Updates      │
└─────────────────────┘
```
## Engineering Highlights:

- Concurrency-safe rental acquisition: Rental availability is checked and updated atomically using a conditional database update. This prevents two concurrent requests from successfully renting the same tool.

- Transactional rental lifecycle: Starting and ending a rental use MongoDB transactions to keep the Tool and Rental documents consistent.

- Historical data integrity: Tools use soft deletion so rental history remains associated with the original tool records.

## Documentation :
- [Backend Documentation- API endpoints, database behavior, rental implementation, and local backend setup.](./server/README.md)
- [Frontend Documentation — Pages, frontend architecture, features, and local setup.](./client/README.md)
