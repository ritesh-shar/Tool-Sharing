const request = require("supertest");
const app = require("../app");

describe("Health Check", () => {
    test("GET / should return Hello", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("Hello");
    });
});
