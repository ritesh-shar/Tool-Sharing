Tool Rental Platform

This is a peer-to-peer (P2P) website which allows you to rent or display tools instead of buying them, thus paying only for the number of hours you use the tool instead of buying a tool you will rarely use.

Tech-Stack:

1) Runtime: Node.js + Express.js
2) Database: MongoDB connected using Mongoose.
3) Token based Authentication/Authorization using JWT.
4) Zod for Validating input given by user.
5) Helmet for setting secure HTTP headers.

Architecture:

1) Used MongoDB transactions in startRental/endRental to ensure atomicity across tool and rental documents.

2) Used findOneAndUpdate for atomic availability check to prevent race conditions under concurrent requests (Time of Check to Time of Use (TOCTOU) prevention).

3) Used Soft delete on tools to preserve rental history integrity

API Endpoints:

1) Users:
 1) To create account - POST /api/users/register
 2) To login - POST /api/users/login
 3) Get current user(protected) - GET /api/users/me

2) Tools:
 1) To add tools - POST /api/tools
 2) To get tools - GET /api/tools
 3) To get User's tools(protected) - GET /api/tools/me 
 4) To delete a tool(protected) - DELETE /api/tools/:id

3) Rentals:
 1) To start a rental(protected) - POST /api/rentals/:id/rent
 2) To end a rental(protected) - POST /api/rentals/:id/end
 3) To view current rentals(protected) - GET /api/rentals/myrentals

Running Locally:

To run locally:

 1) Clone repo.

 2) Run 'npm install'.

 3) Create '.env' file with:
    MONGO_URI 
    JWT_SECRET
    CORS_ORIGIN
    PORT

 4) Run 'npm start'

 5) Server runs on http://localhost:PORT


