const request = require("supertest");
const app = require("../app");
const User = require("../models/user");
const Tool = require("../models/tool");

describe("POST /api/tools", () => {

    test("should create a tool for the authenticated user", async () => {

        const registerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Tool Owner",
                email: "owner@example.com",
                password: "password123"
            });

        const token = registerResponse.body.token;

        const response = await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${token}`)
            .send({
                toolName: "Electric Drill",
                description: "Cordless electric drill",
                location: "Mysuru",
                images: ["https://example.com/drill.jpg"],
                pricePerHour: 100
            });
        expect(response.statusCode).toBe(201);

        expect(response.body).toHaveProperty("addNewTool");

        const createdTool = response.body.addNewTool;

        expect(createdTool.toolName).toBe("Electric Drill");
        expect(createdTool.description).toBe("Cordless electric drill");
        expect(createdTool.location).toBe("Mysuru");
        expect(createdTool.pricePerHour).toBe(100);
        expect(createdTool.isAvailable).toBe(true);
        expect(createdTool.isDeleted).toBe(false);

        expect(createdTool.owner).toBe(
            registerResponse.body.id
        );

        const toolInDatabase = await Tool.findById(createdTool._id);

        expect(toolInDatabase).not.toBeNull();
        expect(toolInDatabase.owner.toString()).toBe(
            registerResponse.body.id
        );
    });
    test("should reject creating a tool without authentication", async () => {
    const response = await request(app)
        .post("/api/tools")
        .send({
            toolName: "Electric Drill",
            description: "Cordless electric drill",
            location: "Mysuru",
            images: ["https://example.com/drill.jpg"],
            pricePerHour: 100
        });

    expect(response.statusCode).toBe(401);
});
test("should prevent a user from deleting another user's tool", async () => {

    // Create User A
    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Tool Owner",
            email: "owner-delete@example.com",
            password: "password123"
        });

    // User A creates the tool
    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Power Saw",
            description: "Heavy duty power saw",
            location: "Mysuru",
            images: ["https://example.com/saw.jpg"],
            pricePerHour: 150
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Create User B
    const attackerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Different User",
            email: "different-user@example.com",
            password: "password123"
        });

    // User B attempts to delete User A's tool
    const response = await request(app)
        .delete(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${attackerResponse.body.token}`);

    expect(response.statusCode).toBe(403);

    expect(response.body).toHaveProperty(
        "message",
        "Not authorized to delete tool"
    );
    const toolAfterAttempt = await Tool.findById(toolId);

expect(toolAfterAttempt).not.toBeNull();
expect(toolAfterAttempt.isDeleted).toBe(false);
});
});

describe("GET /api/tools", () => {

    test("should return all non-deleted tools", async () => {

        const userResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Search User",
                email: "search@example.com",
                password: "password123"
            });

        const token = userResponse.body.token;

        await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${token}`)
            .send({
                toolName: "Electric Drill",
                description: "Cordless electric drill",
                location: "Mysuru",
                images: ["https://example.com/drill.jpg"],
                pricePerHour: 100
            });

        await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${token}`)
            .send({
                toolName: "Power Saw",
                description: "Heavy duty power saw",
                location: "Bangalore",
                images: ["https://example.com/saw.jpg"],
                pricePerHour: 150
            });

        const response = await request(app)
            .get("/api/tools");

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);
        expect(response.body.total).toBe(2);
        expect(response.body.tools).toHaveLength(2);

        expect(response.body.tools[0].toolName).toBe("Power Saw");
        expect(response.body.tools[1].toolName).toBe("Electric Drill");
    });

    test("should soft-delete a tool and exclude it from public results", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Delete Owner",
            email: "softdelete@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    const createResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Hammer",
            description: "Heavy duty construction hammer",
            location: "Mysuru",
            images: ["https://example.com/hammer.jpg"],
            pricePerHour: 50
        });

    const toolId = createResponse.body.addNewTool._id;

    // Delete the tool
    const deleteResponse = await request(app)
        .delete(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.statusCode).toBe(200);

    expect(deleteResponse.body).toHaveProperty(
        "message",
        "Tool deleted"
    );

    // Verify it still exists in the database
    const deletedTool = await Tool.findById(toolId);

    expect(deletedTool).not.toBeNull();
    expect(deletedTool.isDeleted).toBe(true);

    // Verify public API no longer returns it
    const getResponse = await request(app)
        .get("/api/tools");

    expect(getResponse.statusCode).toBe(200);

    expect(getResponse.body.tools).toHaveLength(0);
});
test("should filter tools by location", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Location User",
            email: "location@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Drill",
            description: "Cordless electric drill",
            location: "Mysuru",
            images: ["https://example.com/drill.jpg"],
            pricePerHour: 100
        });

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Saw",
            description: "Heavy duty power saw",
            location: "Bangalore",
            images: ["https://example.com/saw.jpg"],
            pricePerHour: 150
        });

    const response = await request(app)
        .get("/api/tools")
        .query({ location: "Mysuru" });

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.tools).toHaveLength(1);

    expect(response.body.tools[0].location).toBe("Mysuru");
    expect(response.body.tools[0].toolName).toBe("Drill");
});
test("should search tools by name case-insensitively", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Search User",
            email: "toolsearch@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Electric Drill",
            description: "Cordless electric drill",
            location: "Mysuru",
            images: ["https://example.com/drill.jpg"],
            pricePerHour: 100
        });

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Power Saw",
            description: "Heavy duty power saw",
            location: "Mysuru",
            images: ["https://example.com/saw.jpg"],
            pricePerHour: 150
        });

    const response = await request(app)
        .get("/api/tools")
        .query({ toolName: "DRILL" });

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.tools).toHaveLength(1);

    expect(response.body.tools[0].toolName).toBe("Electric Drill");
});
test("should filter tools by minimum and maximum price", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Price User",
            email: "price@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Cheap Drill",
            description: "Affordable electric drill",
            location: "Mysuru",
            images: ["https://example.com/cheap.jpg"],
            pricePerHour: 50
        });

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Mid Range Drill",
            description: "Medium priced electric drill",
            location: "Mysuru",
            images: ["https://example.com/mid.jpg"],
            pricePerHour: 100
        });

    await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Expensive Drill",
            description: "Professional electric drill",
            location: "Mysuru",
            images: ["https://example.com/expensive.jpg"],
            pricePerHour: 200
        });

    const response = await request(app)
        .get("/api/tools")
        .query({
            minPrice: 75,
            maxPrice: 150
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.tools).toHaveLength(1);

    expect(response.body.tools[0].toolName).toBe("Mid Range Drill");
    expect(response.body.tools[0].pricePerHour).toBe(100);
});
test("should filter tools by availability", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Availability User",
            email: "availability@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    const availableResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Available Drill",
            description: "Drill currently available",
            location: "Mysuru",
            images: ["https://example.com/available.jpg"],
            pricePerHour: 100
        });

    const unavailableResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Rented Drill",
            description: "Drill currently rented out",
            location: "Mysuru",
            images: ["https://example.com/rented.jpg"],
            pricePerHour: 100
        });

    // Mark the second tool as unavailable
    await Tool.findByIdAndUpdate(
        unavailableResponse.body.addNewTool._id,
        { isAvailable: false }
    );

    const response = await request(app)
        .get("/api/tools")
        .query({ isAvailable: "true" });

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.tools).toHaveLength(1);

    expect(response.body.tools[0]._id)
        .toBe(availableResponse.body.addNewTool._id);

    expect(response.body.tools[0].isAvailable).toBe(true);
});
test("should paginate tools correctly", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Pagination User",
            email: "pagination@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    for (const name of ["Tool One", "Tool Two", "Tool Three"]) {
        await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${token}`)
            .send({
                toolName: name,
                description: "A useful tool for testing",
                location: "Mysuru",
                images: [`https://example.com/${name.replace(" ", "")}.jpg`],
                pricePerHour: 100
            });
    }

    const response = await request(app)
        .get("/api/tools")
        .query({
            page: 2,
            limit: 2
        });

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(3);
    expect(response.body.totalpages).toBe(2);
    expect(response.body.currentPage).toBe(2);

    expect(response.body.tools).toHaveLength(1);
    expect(response.body.tools[0].toolName).toBe("Tool One");
});
});

describe("GET /api/tools/me", () => {

    test("should return only tools owned by the authenticated user", async () => {

        // User A
        const userA = await request(app)
            .post("/api/users/register")
            .send({
                name: "User A",
                email: "user-a@example.com",
                password: "password123"
            });

        // User B
        const userB = await request(app)
            .post("/api/users/register")
            .send({
                name: "User B",
                email: "user-b@example.com",
                password: "password123"
            });

        // User A creates a tool
        await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${userA.body.token}`)
            .send({
                toolName: "User A Drill",
                description: "Drill owned by User A",
                location: "Mysuru",
                images: ["https://example.com/a-drill.jpg"],
                pricePerHour: 100
            });

        // User B creates a tool
        await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${userB.body.token}`)
            .send({
                toolName: "User B Saw",
                description: "Saw owned by User B",
                location: "Bangalore",
                images: ["https://example.com/b-saw.jpg"],
                pricePerHour: 150
            });

        // User A requests their tools
        const response = await request(app)
            .get("/api/tools/me")
            .set("Authorization", `Bearer ${userA.body.token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);
        expect(response.body.total).toBe(1);
        expect(response.body.tools).toHaveLength(1);

        expect(response.body.tools[0].toolName)
            .toBe("User A Drill");
    });
    test("should exclude soft-deleted tools from my tools", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "My Tools User",
            email: "mytools-delete@example.com",
            password: "password123"
        });

    const token = userResponse.body.token;

    const createResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "Deleted Drill",
            description: "Drill that will be deleted",
            location: "Mysuru",
            images: ["https://example.com/deleted.jpg"],
            pricePerHour: 100
        });

    const toolId = createResponse.body.addNewTool._id;

    await request(app)
        .delete(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${token}`);

    const response = await request(app)
        .get("/api/tools/me")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(0);
    expect(response.body.tools).toHaveLength(0);

    // Make sure soft deletion actually happened
    const deletedTool = await Tool.findById(toolId);

    expect(deletedTool).not.toBeNull();
    expect(deletedTool.isDeleted).toBe(true);
});

});
