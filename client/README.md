Tool Rental Platform

This is a peer-to-peer (P2P) website which allows you to rent or display tools instead of buying them, thus paying only for the number of hours you use the tool instead of buying a tool you will rarely use.

Tech-Stack:

1) Next.js 15 (App Router).
2) Tailwind CSS to design pages.
3) Axios to connect frontend and backend.
4) Context API for auth and theme.

Pages:

1) / — Landing page

2) /tools — Browse and rent tools.

3) /register — Create an account.

4) /login - Login to your account.

5) /addTool — List a tool (protected)

6) /myTools — Manage your tools (protected)

7) /myRentals — View rental history (protected)


Features:

1) JWT authentication with persistent login

2) Dark mode with localStorage persistence

3) Pagination and filtering on tool browsing

4)  Protected routes with redirect

Running Locally:

To run locally:

 1) Clone repo.

 2) Run 'npm install'.

 3) Create '.env' file with:
    NEXT_PUBLIC_API_BASE_URL= BACKEND_PORT

 4) Run 'npm run dev'

 5) Server runs on http://localhost:FRONTEND_PORT

BACKEND:
Backend code is in the /client folder of the same repository.
