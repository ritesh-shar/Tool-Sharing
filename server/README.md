##  Tool Rental Platform

The backend REST API for Tool Sharing, a peer-to-peer tool rental platform. It handles authentication, tool listings, rental operations, authorization, validation, and persistent data storage.

The backend is designed to maintain data consistency during concurrent rental requests, while preserving rental history when tools are deleted.

## Tech Stack:

|# |Layer |Technology |
|- |----- |---------- |
|1 |Runtime| Node.js  |
|2|Framework|Express.js|
|3|Database	|MongoDB|
|4|ODM|	Mongoose|
|5|Authentication|	JWT|
|6|Validation|	Zod|
|7|Security|	Helmet|
|8|Testing|	Jest, Supertest|
|9|CI	|GitHub Actions|

## Architecture:
  
```
Client
  │
  │ REST / HTTP
  ▼
Express REST API 
  │ 
  ├── JWT Authentication 
  ├── Zod Validation 
  ├── Helmet Security 
  │ 
  ▼
  Controllers
  |
  ▼
  Mongoose 
  │
  ▼ 
  MongoDB
```

## Key Engineering Decisions

- Concurrency-Safe Rental Acquisition
A rental request uses a conditional findOneAndUpdate that checks whether a tool is available and updates its availability as a single database operation.

```
Request A ──┐
            ├──► Atomic availability check + update
Request B ──┘
```

Only one request can successfully acquire the available tool.

This prevents two concurrent users from successfully renting the same tool and avoids a Time-of-Check to Time-of-Use (TOCTOU) race condition.

- MongoDB Transactions

Starting and ending a rental involve changes to both the Tool and Rental documents.

MongoDB transactions ensure these related operations are committed together or rolled back together, preventing inconsistent rental state.

- Soft Deletion

Tools use soft deletion rather than being physically removed from the database. This preserves references required by historical rental records.

## API Endpoints:

### Users:
|# |Method | Endpoint |	Authentication |	Description |
|-|------ | ------- | ------- | ------- |
|1| POST | `/api/users/register` |	Public |	Create an account |
|2| POST	| `/api/users/login` |	Public |	Authenticate a user |
|3| GET	| `/api/users/me`	| Protected |	Get the current user |

### Tools:
|# |Method | Endpoint |	Authentication |	Description |
|-|------ | ------- | ------- | ------- |
|1| POST | `/api/tools` |	Protected |	List a tool |
|2| GET	| `/api/tools` |	Public |	Browse available tools |
|3| GET	| `/api/tools/me`	| Protected |	Get the user's tools |
|4| DELETE| `/api/tools/:id` | Protected | Soft-delete a tool |

### Rentals:
|# |Method | Endpoint |	Authentication |	Description |
|-|------ | ------- | ------- | ------- |
|1| POST | `/api/rentals/:id/rent` |	Protected |	Start a rental |
|2| POST	| `/api/rentals/:id/end` |	Protected |	End a rental  |
|3| GET	| `/api/rentals/myrentals`	| Protected |	View the user's rentals |

## Testing

The backend contains 38 integration tests using Jest and Supertest , and an in-memory MongoDB test environment.

Test coverage includes:

- User registration and authentication
- Protected routes and authorization
- Tool creation and management
- Rental lifecycle
- Invalid input and IDs
- Rental ownership rules
- Pagination and filtering
- Concurrent rental attempts
- Transaction rollback during rental creation
- Transaction rollback during rental completion
- Prevention of duplicate concurrent rentals

```
Current test result:

Test Suites: 4 passed, 4 total
Tests:       38 passed, 38 total
```

## Continuous Integration

GitHub Actions automatically installs dependencies and runs the complete backend test suite whenever changes are pushed to main.

``` text
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

## Code Coverage

Latest Jest coverage:

Statements: 93.33%
Branches:   87.80%
Functions:  94.44%
Lines:      93.61%

## Performance Benchmarking

The backend includes dedicated benchmark programs under:

```
benchmark/
├── health.js
├── api.js
├── rental.js
├── db.js
└── stress.js
```

Benchmarks measure:

- Throughput
- Average latency
- p50 latency
- p95 latency
- p99 latency
- Success rate
- Behavior under concurrent requests
- Database query scalability

### 1. Health Endpoint Benchmark

```
Requests:   1000
Successful: 1000
Failed:     0

Throughput: 3463.67 req/s
Average:    13.23 ms
p50:        11.72 ms
p95:        17.27 ms
p99:        37.39 ms
```

### 2. Rental Concurrency Benchmark

50 independent rental requests were executed concurrently against separate tools.

```
Requests: 50 
Successful: 50 
Failed: 0 
Throughput: 21.92 req/s 
Average: 1456.32 ms 
p50: 1415.27 ms 
p95: 2217.76 ms 
p99: 2276.42 ms
```
The benchmark validates the normal rental path under concurrent load.

The integration test suite separately validates that simultaneous attempts to rent the same tool cannot produce multiple successful rentals.

### 3. API Benchmark

500 requests were executed per endpoint with concurrency of 25.

```
GET /api/tools
Requests:   500
Successful: 500
Failed:     0
Throughput: 36.06 req/s
Average:    690.11 ms
p50:        921.05 ms
p95:        990.99 ms
p99:        1951.35 ms
```

```
GET /api/rentals/myrentals
Requests:   500
Successful: 500
Failed:     0
Throughput: 37.71 req/s
Average:    645.99 ms
p50:        941.35 ms
p95:        975.77 ms
p99:        1953.99 ms
```

```
POST /api/tools
Requests:   500
Successful: 500
Failed:     0
Throughput: 56.87 req/s
Average:    436.74 ms
p50:        87.94 ms
p95:        926.69 ms
p99:        934.97 ms
```

### 4. Database Scalability Benchmark

The database benchmark populated MongoDB with 5,000 tool documents and measured paginated and filtered queries.

```
Page 1
Requests:   100
Concurrency: 10
Successful: 100
Throughput: 37.69 req/s
Average:    258.13 ms
p95:        810.24 ms
p99:        971.00 ms
```

```
Page 100
Requests:   100
Concurrency: 10
Successful: 100
Throughput: 33.86 req/s
Average:    290.66 ms
p95:        822.98 ms
p99:        888.42 ms
```

```
Page 500
Requests:   100
Concurrency: 10
Successful: 100
Throughput: 33.80 req/s
Average:    293.95 ms
p95:        826.11 ms
p99:        847.77 ms
```

```
Location Filter
Requests:   100
Concurrency: 10
Successful: 100
Throughput: 34.45 req/s
Average:    281.11 ms
p95:        816.83 ms
p99:        820.60 ms
```

```
Price Filter
Requests:   100
Concurrency: 10
Successful: 100
Throughput: 44.98 req/s
Average:    218.95 ms
p95:        774.80 ms
p99:        797.79 ms
```

### 5. Concurrency Stress Test

The final stress benchmark tested the API at increasing concurrency levels.

|# |Concurrency |Requests |Success Rate |Throughput |Average |p95 |p99 |
|1 |10 |	500 |	100% |	35.24 req/s |	283 ms |	827 ms |	934 ms |
|2 |25 |	500 |	100% |	38.44 req/s |	649 ms |	975 ms |	1945 ms |
|3 |50 |	500 |	100% |	40.99 req/s |	1178 ms |	1936 ms |	2074 ms |
|4 |100 |	500 |	100% |	44.18 req/s |	2182 ms |	2957 ms |	3934 ms |

The results show that the backend maintained a 100% request success rate across all tested concurrency levels, while latency increased as concurrency increased.

This demonstrates graceful degradation under the tested workload rather than request failures.

## Running Locally
1. Clone the repository
```bash
git clone https://github.com/ritesh-shar/Tool-Sharing.git
cd Tool-Sharing/server
```
2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a .env file:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=your_port
CORS_ORIGIN=your_frontend_origin
```

4. Start the backend
```bash
npm start
```

The API will run on:

http://localhost:PORT


5. Run tests
```bash
npm test
```

## FRONTEND:

Frontend

The frontend application is located in the /client directory.

See the Frontend README for frontend architecture, routes, features, and setup instructions.

[Frontend Documentation — Pages, frontend architecture, features, and local setup.](../client/README.md)

