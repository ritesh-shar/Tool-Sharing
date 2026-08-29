## Tool Rental Platform
The frontend application for Tool Sharing, a peer-to-peer tool rental platform where users can list tools, browse available tools, rent tools from other users, and manage their rentals.

The application provides the user interface for authentication, tool discovery, tool management, and rental management.

## Tech Stack:

|# |Layer |	Technology |
|1 |Framework |Next.js 15 (App Router) |
|2 |UI| React |
|3 |Styling | Tailwind CSS |  
|4 |API Communication |	Axios |
|5 |State Management |	Context API |
|6 |Authentication |	JWT |
|7 |Theme Management |	Context API + localStorage |
|8 |Deployment	| Vercel |

## Pages & Routes:

|# |Route |	Access |	Description |
|1 |`/`	| Public |	Landing page |
|2 |`/tools` |	Public |	Browse and rent available tools |
|3 |`/register` |	Public |	Create an account |
|4 |`/login` |	Public |	Log in to an existing account |
|5 |`/addTool` |	Protected |	List a new tool |
|6 |`/myTools` |	Protected |	Manage the user's tools |
|7 |`/myRentals` |	Protected | View rental history |

## Features:

### Authentication
- JWT-based authentication
- Persistent login across page refreshes
- Protected routes
- Automatic redirection for unauthorized users

### Tool Discovery
- Browse available tools
- Pagination for tool listings
- Filtering while browsing tools
- Tool details and rental actions

### Tool Management

Authenticated users can:

- List their own tools
- View their listed tools
- Remove their tools

### Rental Management

Users can:

- Rent available tools
- View active rentals
- End rentals
- View rental history

### Theme

The application supports dark mode with the selected theme persisted using `localStorage`.

## Architecture
```
┌─────────────────────────┐
│      Next.js App        │
│       App Router        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    React Components     │
│                         │
│  Pages │ UI │ Context   │
└────────────┬────────────┘
             │
             │ Axios / REST
             ▼
┌─────────────────────────┐
│      Express API        │
│        /server          │
└─────────────────────────┘
```

## Authentication Flow:
```
User 
 │ 
 ▼ 
Login / Register 
 │ 
 ▼ 
Backend Authentication 
 │ 
 ▼ 
JWT Token 
 │ 
 ▼ 
Frontend Auth Context 
 │ 
 ▼ 
Protected Routes
```

## Running Locally:

1. Clone the repository
```bash
git clone https://github.com/ritesh-shar/Tool-Sharing.git
cd Tool-Sharing/client
```
2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a .env.local file:
```
NEXT_PUBLIC_API_BASE_URL=your_backend_url
BACKEND_PORT=your_backend_port
```

4. Start the development server
```bash
npm run dev
```
The frontend will run on the development server shown by Next.js, typically:

http://localhost:3000

BACKEND:
The backend API is located in the /server directory.

See the Backend README for API endpoints, database architecture, rental concurrency handling, testing, CI, and backend setup.

[Backend Documentation- API endpoints, database behavior, rental implementation, and local backend setup.](../server/README.md)
