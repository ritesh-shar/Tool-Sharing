const request = require("supertest");
const app = require("../app");
const Tool = require("../models/tool");
const Rental = require("../models/rental");

describe("POST /api/rentals/:id/rent", () => {

    test("should allow a user to rent an available tool", async () => {

        // Create owner
        const ownerResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Tool Owner",
                email: "rental-owner@example.com",
                password: "password123"
            });

        // Create renter
        const renterResponse = await request(app)
            .post("/api/users/register")
            .send({
                name: "Tool Renter",
                email: "rental-renter@example.com",
                password: "password123"
            });

        const ownerToken = ownerResponse.body.token;
        const renterToken = renterResponse.body.token;

        // Owner creates tool
        const toolResponse = await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                toolName: "Electric Drill",
                description: "Cordless electric drill",
                location: "Mysuru",
                images: ["https://example.com/drill.jpg"],
                pricePerHour: 100
            });

        const toolId = toolResponse.body.addNewTool._id;

        // Renter rents the tool
        const rentalResponse = await request(app)
            .post(`/api/rentals/${toolId}/rent`)
            .set("Authorization", `Bearer ${renterToken}`);

        expect(rentalResponse.statusCode).toBe(201);

        expect(rentalResponse.body).toHaveProperty("rentalid");
        expect(rentalResponse.body).toHaveProperty("toolId", toolId);
        expect(rentalResponse.body).toHaveProperty("starttime");

        // Verify Rental document
        const rental = await Rental.findById(
            rentalResponse.body.rentalid
        );

        expect(rental).not.toBeNull();
        expect(rental.renter.toString())
            .toBe(renterResponse.body.id);

        expect(rental.tool.toString())
            .toBe(toolId);

        expect(rental.owner.toString())
            .toBe(ownerResponse.body.id);

        expect(rental.pricePerHour).toBe(100);
        expect(rental.status).toBe("Active");

        // Verify Tool state changed
        const tool = await Tool.findById(toolId);

        expect(tool.isAvailable).toBe(false);
        expect(tool.renter.toString())
            .toBe(renterResponse.body.id);
    });
    test("should prevent renting a tool that is already rented", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Owner",
            email: "busy-owner@example.com",
            password: "password123"
        });

    const renterA = await request(app)
        .post("/api/users/register")
        .send({
            name: "Renter A",
            email: "renter-a@example.com",
            password: "password123"
        });

    const renterB = await request(app)
        .post("/api/users/register")
        .send({
            name: "Renter B",
            email: "renter-b@example.com",
            password: "password123"
        });

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Shared Drill",
            description: "Drill available for rental",
            location: "Mysuru",
            images: ["https://example.com/shared-drill.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Renter A successfully rents it
    const firstRental = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterA.body.token}`);

    expect(firstRental.statusCode).toBe(201);

    // Renter B attempts to rent the same tool
    const secondRental = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterB.body.token}`);

    expect(secondRental.statusCode).toBe(400);

    expect(secondRental.body).toHaveProperty(
        "message",
        "Tool is not available for rent"
    );

    // Verify only one rental exists
    const rentals = await Rental.find({
        tool: toolId
    });

    expect(rentals).toHaveLength(1);
    expect(rentals[0].renter.toString())
        .toBe(renterA.body.id);

    // Verify the tool still belongs to Renter A
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(false);
    expect(tool.renter.toString())
        .toBe(renterA.body.id);
});
test("should prevent the owner from renting their own tool", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Tool Owner",
            email: "self-rent-owner@example.com",
            password: "password123"
        });

    const token = ownerResponse.body.token;

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${token}`)
        .send({
            toolName: "My Own Drill",
            description: "Drill owned by the current user",
            location: "Mysuru",
            images: ["https://example.com/my-drill.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    const response = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);

    expect(response.body).toHaveProperty(
        "message",
        "Cannot rent what you own"
    );

    // Verify no rental was created
    const rentals = await Rental.find({
        tool: toolId
    });

    expect(rentals).toHaveLength(0);

    // Verify tool remains available
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(true);
    expect(tool.renter).toBeNull();
});
test("should end an active rental and make the tool available again", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Rental Owner",
            email: "end-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Rental User",
            email: "end-renter@example.com",
            password: "password123"
        });

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Rental Drill",
            description: "Drill used for rental testing",
            location: "Mysuru",
            images: ["https://example.com/rental-drill.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Start rental
    const rentalResponse = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(rentalResponse.statusCode).toBe(201);

    const rentalId = rentalResponse.body.rentalid;

    // Make rental start time 2 hours ago
    await Rental.findByIdAndUpdate(rentalId, {
        rentTimeStart: new Date(Date.now() - 30 *  60 * 1000)
    });

    // End rental
    const rentalBeforeEnd = await Rental.findById(rentalId);

    const endResponse = await request(app)
        .post(`/api/rentals/${rentalId}/end`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(endResponse.statusCode).toBe(200);

    expect(endResponse.body).toHaveProperty(
        "message",
        "Rental Ended"
    );
    expect(endResponse.body.totalCost).toBe(100);

    // Verify rental state
    const rental = await Rental.findById(rentalId);

    expect(rental.status).toBe("Completed");
    expect(rental.rentTimeEnd).not.toBeNull();
    expect(rental.totalCost).toBe(100);

    // Verify tool state
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(true);
    expect(tool.renter).toBeNull();
});
test("should prevent another user from ending someone else's rental", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Owner",
            email: "auth-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Renter",
            email: "auth-renter@example.com",
            password: "password123"
        });

    const attackerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Attacker",
            email: "auth-attacker@example.com",
            password: "password123"
        });

    // Owner creates tool
    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Protected Drill",
            description: "Drill for authorization testing",
            location: "Mysuru",
            images: ["https://example.com/protected.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Renter starts rental
    const rentalResponse = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(rentalResponse.statusCode).toBe(201);

    const rentalId = rentalResponse.body.rentalid;

    // Attacker tries to end the rental
    const response = await request(app)
        .post(`/api/rentals/${rentalId}/end`)
        .set("Authorization", `Bearer ${attackerResponse.body.token}`);

    expect(response.statusCode).toBe(403);

    expect(response.body).toHaveProperty(
        "message",
        "Not authorised to end the rental"
    );

    // Rental must remain active
    const rental = await Rental.findById(rentalId);

    expect(rental.status).toBe("Active");
    expect(rental.rentTimeEnd).toBeUndefined();
    expect(rental.totalCost).toBe(0);

    // Tool must remain rented
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(false);
    expect(tool.renter.toString())
        .toBe(renterResponse.body.id);
});
test("should return 404 when ending a nonexistent rental", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Missing Rental User",
            email: "missing-rental@example.com",
            password: "password123"
        });

    const response = await request(app)
        .post("/api/rentals/507f1f77bcf86cd799439011/end")
        .set("Authorization", `Bearer ${userResponse.body.token}`);

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty(
        "message",
        "Rental not found"
    );
});
test("should prevent ending a rental that is already completed", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Completed Owner",
            email: "completed-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Completed Renter",
            email: "completed-renter@example.com",
            password: "password123"
        });

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Completed Rental Tool",
            description: "Tool for completed rental testing",
            location: "Mysuru",
            images: ["https://example.com/tool.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Start rental
    const rentalResponse = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(rentalResponse.statusCode).toBe(201);

    const rentalId = rentalResponse.body.rentalid;

    // End rental once
    const firstEndResponse = await request(app)
        .post(`/api/rentals/${rentalId}/end`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(firstEndResponse.statusCode).toBe(200);

    // Try to end it again
    const secondEndResponse = await request(app)
        .post(`/api/rentals/${rentalId}/end`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(secondEndResponse.statusCode).toBe(400);

    expect(secondEndResponse.body).toHaveProperty(
        "message",
        "Tool not in use"
    );

    // Verify it remains completed
    const rental = await Rental.findById(rentalId);

    expect(rental.status).toBe("Completed");
    expect(rental.rentTimeEnd).not.toBeNull();
});
test("should return only rentals belonging to the authenticated user", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Rental Owner",
            email: "history-owner@example.com",
            password: "password123"
        });

    const renterA = await request(app)
        .post("/api/users/register")
        .send({
            name: "Renter A",
            email: "history-a@example.com",
            password: "password123"
        });

    const renterB = await request(app)
        .post("/api/users/register")
        .send({
            name: "Renter B",
            email: "history-b@example.com",
            password: "password123"
        });

    const ownerToken = ownerResponse.body.token;

    // Create two tools
    const toolA = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            toolName: "Drill A",
            description: "Drill for renter A",
            location: "Mysuru",
            images: ["https://example.com/drill-a.jpg"],
            pricePerHour: 100
        });

    const toolB = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            toolName: "Drill B",
            description: "Drill for renter B",
            location: "Mysuru",
            images: ["https://example.com/drill-b.jpg"],
            pricePerHour: 150
        });

    // Renter A rents tool A
    const rentalA = await request(app)
        .post(`/api/rentals/${toolA.body.addNewTool._id}/rent`)
        .set("Authorization", `Bearer ${renterA.body.token}`);

    // Renter B rents tool B
    const rentalB = await request(app)
        .post(`/api/rentals/${toolB.body.addNewTool._id}/rent`)
        .set("Authorization", `Bearer ${renterB.body.token}`);

    expect(rentalA.statusCode).toBe(201);
    expect(rentalB.statusCode).toBe(201);

    // Renter A requests their rental history
    const response = await request(app)
        .get("/api/rentals/myrentals")
        .set("Authorization", `Bearer ${renterA.body.token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.rentals).toHaveLength(1);

    expect(response.body.rentals[0]._id)
        .toBe(rentalA.body.rentalid);

    expect(response.body.rentals[0].renter)
        .toBe(renterA.body.id);
});
test("should filter my rentals by status", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Status Owner",
            email: "status-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Status Renter",
            email: "status-renter@example.com",
            password: "password123"
        });

    const ownerToken = ownerResponse.body.token;
    const renterToken = renterResponse.body.token;

    // Create two tools
    const toolA = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            toolName: "Active Drill",
            description: "Tool for active rental",
            location: "Mysuru",
            images: ["https://example.com/active.jpg"],
            pricePerHour: 100
        });

    const toolB = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            toolName: "Completed Drill",
            description: "Tool for completed rental",
            location: "Mysuru",
            images: ["https://example.com/completed.jpg"],
            pricePerHour: 100
        });

    // Start both rentals
    const activeRental = await request(app)
        .post(`/api/rentals/${toolA.body.addNewTool._id}/rent`)
        .set("Authorization", `Bearer ${renterToken}`);

    const completedRental = await request(app)
        .post(`/api/rentals/${toolB.body.addNewTool._id}/rent`)
        .set("Authorization", `Bearer ${renterToken}`);

    expect(activeRental.statusCode).toBe(201);
    expect(completedRental.statusCode).toBe(201);

    // Complete the second rental
    const endResponse = await request(app)
        .post(`/api/rentals/${completedRental.body.rentalid}/end`)
        .set("Authorization", `Bearer ${renterToken}`);

    expect(endResponse.statusCode).toBe(200);

    // Request only Active rentals
    const response = await request(app)
        .get("/api/rentals/myrentals?status=Active")
        .set("Authorization", `Bearer ${renterToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(1);
    expect(response.body.rentals).toHaveLength(1);

    expect(response.body.rentals[0]._id)
        .toBe(activeRental.body.rentalid);

    expect(response.body.rentals[0].status)
        .toBe("Active");
});
test("should paginate my rentals", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Pagination Owner",
            email: "pagination-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Pagination Renter",
            email: "pagination-renter@example.com",
            password: "password123"
        });

    const ownerToken = ownerResponse.body.token;
    const renterToken = renterResponse.body.token;

    // Create 3 tools
    for (let i = 1; i <= 3; i++) {

        const toolResponse = await request(app)
            .post("/api/tools")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                toolName: `Pagination Tool ${i}`,
                description: `Tool used for pagination test ${i}`,
                location: "Mysuru",
                images: [`https://example.com/tool-${i}.jpg`],
                pricePerHour: 100
            });

        expect(toolResponse.statusCode).toBe(201);

        // Rent the tool
        const rentalResponse = await request(app)
            .post(`/api/rentals/${toolResponse.body.addNewTool._id}/rent`)
            .set("Authorization", `Bearer ${renterToken}`);

        expect(rentalResponse.statusCode).toBe(201);

        // Complete the rental
        const endResponse = await request(app)
            .post(`/api/rentals/${rentalResponse.body.rentalid}/end`)
            .set("Authorization", `Bearer ${renterToken}`);

        expect(endResponse.statusCode).toBe(200);
    }

    // Request page 1 with limit 2
    const response = await request(app)
        .get("/api/rentals/myrentals?page=1&limit=2")
        .set("Authorization", `Bearer ${renterToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.total).toBe(3);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.currentPage).toBe(1);
    expect(response.body.rentals).toHaveLength(2);

    // Request page 2
    const pageTwo = await request(app)
        .get("/api/rentals/myrentals?page=2&limit=2")
        .set("Authorization", `Bearer ${renterToken}`);

    expect(pageTwo.statusCode).toBe(200);

    expect(pageTwo.body.total).toBe(3);
    expect(pageTwo.body.totalPages).toBe(2);
    expect(pageTwo.body.currentPage).toBe(2);
    expect(pageTwo.body.rentals).toHaveLength(1);
});
test("should handle an invalid rental ID", async () => {

    const userResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Invalid ID User",
            email: "invalid-rental-id@example.com",
            password: "password123"
        });

    const response = await request(app)
        .post("/api/rentals/not-a-valid-mongodb-id/end")
        .set("Authorization", `Bearer ${userResponse.body.token}`);

    expect(response.statusCode).toBe(400);

expect(response.body).toHaveProperty(
    "message",
    "Invalid rental ID"
);
});
test("should rollback tool availability if rental creation fails", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Rollback Owner",
            email: "rollback-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Rollback Renter",
            email: "rollback-renter@example.com",
            password: "password123"
        });

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Rollback Drill",
            description: "Tool used to test transaction rollback",
            location: "Mysuru",
            images: ["https://example.com/rollback.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Temporarily break Rental.create so the transaction fails
    const originalCreate = Rental.create;

    Rental.create = jest.fn().mockRejectedValue(
        new Error("Simulated rental creation failure")
    );

    const response = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(response.statusCode).toBe(500);

    // Restore the real implementation
    Rental.create = originalCreate;

    // The transaction should have rolled the tool update back
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(true);
    expect(tool.renter).toBeNull();

    // No rental should have been created
    const rentals = await Rental.find({
        tool: toolId
    });

    expect(rentals).toHaveLength(0);
});
test("should rollback ending a rental if saving the rental fails", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "End Rollback Owner",
            email: "end-rollback-owner@example.com",
            password: "password123"
        });

    const renterResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "End Rollback Renter",
            email: "end-rollback-renter@example.com",
            password: "password123"
        });

    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "End Rollback Tool",
            description: "Tool used to test ending rollback",
            location: "Mysuru",
            images: ["https://example.com/end-rollback.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    const rentalResponse = await request(app)
        .post(`/api/rentals/${toolId}/rent`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(rentalResponse.statusCode).toBe(201);

    const rentalId = rentalResponse.body.rentalid;

    // Force Rental.save() to fail.
    const originalSave = Rental.prototype.save;

    Rental.prototype.save = jest.fn().mockRejectedValue(
        new Error("Simulated rental save failure")
    );

    const response = await request(app)
        .post(`/api/rentals/${rentalId}/end`)
        .set("Authorization", `Bearer ${renterResponse.body.token}`);

    expect(response.statusCode).toBe(500);

    // Restore implementation
    Rental.prototype.save = originalSave;

    // Rental should still be Active
    const rental = await Rental.findById(rentalId);

    expect(rental.status).toBe("Active");
    expect(rental.rentTimeEnd).toBeUndefined();
    expect(rental.totalCost).toBe(0);

    // Tool should still be rented
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(false);
    expect(tool.renter.toString())
        .toBe(renterResponse.body.id);
});
test("should allow only one user to rent a tool during concurrent rental attempts", async () => {

    const ownerResponse = await request(app)
        .post("/api/users/register")
        .send({
            name: "Concurrent Owner",
            email: "concurrent-owner@example.com",
            password: "password123"
        });

    const renterA = await request(app)
        .post("/api/users/register")
        .send({
            name: "Concurrent Renter A",
            email: "concurrent-a@example.com",
            password: "password123"
        });

    const renterB = await request(app)
        .post("/api/users/register")
        .send({
            name: "Concurrent Renter B",
            email: "concurrent-b@example.com",
            password: "password123"
        });

    // Owner creates the tool
    const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${ownerResponse.body.token}`)
        .send({
            toolName: "Concurrent Drill",
            description: "Tool used for concurrent rental testing",
            location: "Mysuru",
            images: ["https://example.com/concurrent.jpg"],
            pricePerHour: 100
        });

    const toolId = toolResponse.body.addNewTool._id;

    // Both users attempt to rent at essentially the same time
    const [responseA, responseB] = await Promise.all([
        request(app)
            .post(`/api/rentals/${toolId}/rent`)
            .set("Authorization", `Bearer ${renterA.body.token}`),

        request(app)
            .post(`/api/rentals/${toolId}/rent`)
            .set("Authorization", `Bearer ${renterB.body.token}`)
    ]);

    const responses = [responseA, responseB];

    const successful = responses.filter(
        response => response.statusCode === 201
    );

    const failed = responses.filter(
        response => response.statusCode === 400
    );

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(1);

    // Exactly one rental should exist
    const rentals = await Rental.find({
        tool: toolId
    });

    expect(rentals).toHaveLength(1);
    expect(rentals[0].status).toBe("Active");

    // Tool should belong to the successful renter
    const tool = await Tool.findById(toolId);

    expect(tool.isAvailable).toBe(false);
    expect(tool.renter.toString())
        .toBe(rentals[0].renter.toString());
});
test("should allow only one user to rent a tool among 20 concurrent rental attempts", async () => { 
    const ownerResponse = await request(app) 
    .post("/api/users/register") 
    .send({ 
        name: "Stress Test Owner", 
        email: "stress-owner@example.com", 
        password: "password123" }); 
        // Create 20 renters 
        const renterResponses = await Promise.all( 
            Array.from({ length: 20 }, (_, i) => 
                request(app) 
            .post("/api/users/register") .send({ 
                name: `Stress Renter ${i}`, 
                email: `stress-renter-${i}@example.com`, 
                password: "password123" }) ) ); 
                // Owner creates one tool 
                const toolResponse = await request(app) 
                .post("/api/tools") .set("Authorization", `Bearer ${ownerResponse.body.token}`) 
                .send({ 
                    toolName: "Stress Test Drill", 
                    description: "Tool used for concurrent rental stress testing", 
                    location: "Mysuru", 
                    images: ["https://example.com/stress-drill.jpg"], 
                    pricePerHour: 100 }); 
                    expect(toolResponse.statusCode).toBe(201); 
                    const toolId = toolResponse.body.addNewTool._id; 
                    // All 20 users attempt to rent the same tool simultaneously 
                    const responses = await Promise.all( renterResponses.map(renter => request(app) 
                    .post(`/api/rentals/${toolId}/rent`) 
                    .set("Authorization", `Bearer ${renter.body.token}`) ) ); 
                    // Exactly one request should succeed 
                    const successful = responses.filter( response => response.statusCode === 201 ); 
                    const failed = responses.filter( response => response.statusCode === 400 ); 
                    expect(successful).toHaveLength(1); 
                    expect(failed).toHaveLength(19); 
                    // Exactly one rental document should exist 
                    const rentals = await Rental.find({ tool: toolId }); 
                    expect(rentals).toHaveLength(1); 
                    expect(rentals[0].status).toBe("Active"); 
                    // The tool must be unavailable and assigned to the successful renter 
                    const tool = await Tool.findById(toolId); 
                    expect(tool.isAvailable).toBe(false); 
                    expect(tool.renter).not.toBeNull(); 
                    expect(tool.renter.toString()).toBe(rentals[0].renter.toString());
                     // The successful renter must be one of the 20 attempted renters 
                     const renterIds = renterResponses.map( renter => renter.body.id ); 
                     expect(renterIds).toContain( rentals[0].renter.toString() ); 
                    });
});
