##  Tool Rental Platform

The backend REST API for Tool Sharing, a peer-to-peer tool rental platform. It handles authentication, tool listings, rental operations, authorization, validation, and persistent data storage.

The backend is designed to maintain data consistency during concurrent rental requests, while preserving rental history when tools are deleted.

## Tech-Stack:

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
  
'''
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
  Mongoose 
  │
  ▼ 
  MongoDB
'''

## Key Engineering Decisions

- Concurrency-Safe Rental Acquisition
A rental request uses a conditional findOneAndUpdate that checks whether a tool is available and updates its availability as a single database operation.

Request A ──┐
            ├──► Atomic availability check + update
Request B ──┘

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
|1| POST | '''/api/users/register''' |	Public |	Create an account |
|2| POST	| '''/api/users/login''' |	Public |	Authenticate a user |
|3| GET	| '''/api/users/me'''	| Protected |	Get the current user |

### Tools:
|# |Method | Endpoint |	Authentication |	Description |
|-|------ | ------- | ------- | ------- |
|1| POST | '''/api/tools''' |	Protected |	List a tool |
|2| GET	| '''/api/tools''' |	Public |	Browse available tools |
|3| GET	| '''/api/tools/me'''	| Protected |	Get the user's tools |
|4| DELETE| '''/api/tools/:id''' | Protected | Soft-delete a tool |

### Rentals:
|# |Method | Endpoint |	Authentication |	Description |
|-|------ | ------- | ------- | ------- |
|1| POST | '''/api/rentals/:id/rent''' |	Protected |	Create an account |
|2| POST	| '''/api/rentals/:id/end''' |	Protected |	Authenticate a user |
|3| GET	| '''/api/rentals/myrentals'''	| Protected |	Get the current user |
 1) To start a rental(protected) - POST /api/rentals/:id/rent
 2) To end a rental(protected) - POST /api/rentals/:id/end
 3) To view current rentals(protected) - GET /api/rentals/myrentals

## Testing

The backend contains 37 integration tests using Jest and Supertest.

Test coverage includes:

- User registration and authentication
- Protected routes and authorization
- Tool creation and management
- Rental lifecycle
- Invalid input and IDs
- Rental ownership rules
- Pagination and filtering
- Concurrent rental attempts

Current test result:

Test Suites: 4 passed, 4 total
Tests:       37 passed, 37 total

## Continuous Integration

GitHub Actions automatically installs dependencies and runs the complete backend test suite whenever changes are pushed to main.

''' text
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
'''

## Running Locally
1. Clone the repository
'''bash
git clone https://github.com/ritesh-shar/Tool-Sharing.git
cd Tool-Sharing/server
'''
2. Install dependencies
'''bash
npm install
'''
3. Configure environment variables

Create a .env file:
'''
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=your_port
CORS_ORIGIN=your_frontend_origin
'''

4. Start the backend
'''bash
npm start
'''

The API will run on:

http://localhost:PORT
5. Run tests
'''bash
npm test
'''
## FRONTEND:

Frontend

The frontend application is located in the /client directory.

See the Frontend README for frontend architecture, routes, features, and setup instructions.

[Frontend Documentation — Pages, frontend architecture, features, and local setup.](../client/README.md)

