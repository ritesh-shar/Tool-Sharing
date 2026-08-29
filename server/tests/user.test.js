const request = require("supertest");
const app = require("../app");
const User = require("../models/user");

describe("POST /api/users/register", () => {

    test("should register a new user successfully", async () => {

        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(201);

        expect(response.body).toHaveProperty("name", "Test User");
        expect(response.body).toHaveProperty("email", "test@example.com");
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("token");

        const user = await User.findOne({
            email: "test@example.com"
        });
                expect(user).not.toBeNull();
        expect(user.name).toBe("Test User");

        // Password should NOT be stored in plaintext
        expect(user.password).not.toBe("password123");
        expect(user.password).toMatch(/^\$2[aby]\$/);
    });
    test("should reject registration with an existing email", async () => {

    await request(app)
        .post("/api/users/register")
        .send({
            name: "First User",
            email: "duplicate@example.com",
            password: "password123"
        });

    const response = await request(app)
        .post("/api/users/register")
        .send({
            name: "Second User",
            email: "duplicate@example.com",
            password: "differentpassword"
        });

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty(
        "message",
        "Email already exists"
    );

    const users = await User.find({
        email: "duplicate@example.com"
    });

    expect(users).toHaveLength(1);
});
});

describe("Registration validation", () => {

    test("should reject a name shorter than 3 characters", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "AB",
                email: "valid@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
    });

    test("should reject an invalid email", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Valid User",
                email: "not-an-email",
                password: "password123"
            });

        expect(response.statusCode).toBe(400);
    });

    test("should reject a password shorter than 8 characters", async () => {
        const response = await request(app)
            .post("/api/users/register")
            .send({
                name: "Valid User",
                email: "valid@example.com",
                password: "1234567"
            });

        expect(response.statusCode).toBe(400);
    });

});

describe("POST /api/users/login", () => {

    test("should login a registered user successfully", async () => {

        await request(app)
            .post("/api/users/register")
            .send({
                name: "Login User",
                email: "login@example.com",
                password: "password123"
            });

        const response = await request(app)
            .post("/api/users/login")
            .send({
                email: "login@example.com",
                password: "password123"
            });

        expect(response.statusCode).toBe(200);

        expect(response.body).toHaveProperty("name", "Login User");
        expect(response.body).toHaveProperty("email", "login@example.com");
        expect(response.body).toHaveProperty("token");

        expect(response.body.token).toEqual(
            expect.any(String)
        );
    });
    test("should reject login with an incorrect password", async () => {

    await request(app)
        .post("/api/users/register")
        .send({
            name: "Wrong Password User",
            email: "wrongpass@example.com",
            password: "password123"
        });

    const response = await request(app)
        .post("/api/users/login")
        .send({
            email: "wrongpass@example.com",
            password: "wrongpassword"
        });

    expect(response.statusCode).toBe(401);

    expect(response.body).toHaveProperty(
        "message",
        "Invalid credentials"
    );

    expect(response.body).not.toHaveProperty("token");
});
test("should reject login for a non-existent user", async () => {

    const response = await request(app)
        .post("/api/users/login")
        .send({
            email: "doesnotexist@example.com",
            password: "password123"
        });

    expect(response.statusCode).toBe(401);

    expect(response.body).toHaveProperty(
        "message",
        "Invalid credentials"
    );

    expect(response.body).not.toHaveProperty("token");
});
});

describe("GET /api/users/me", () => {

    test("should return the authenticated user's information", async () => {

        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Authenticated User",
                email: "auth@example.com",
                password: "password123"
            });

        const token = registerResponse.body.token;

        const response = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toHaveProperty(
            "name",
            "Authenticated User"
        );

        expect(response.body).toHaveProperty(
            "email",
            "auth@example.com"
        );

        expect(response.body).not.toHaveProperty("password");
    });
test("should reject access without a token", async () => {
    const response = await request(app)
        .get("/api/users/me");

    expect(response.statusCode).toBe(401);

    expect(response.body).not.toHaveProperty("email");
});
});
