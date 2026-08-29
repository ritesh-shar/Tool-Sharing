const http = require("http");

const HOST = "localhost";
const PORT = 5000;

const CONCURRENCY = 10;
const TOOLS_PER_OWNER = 5;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();

        const data = body ? JSON.stringify(body) : null;

        const options = {
            hostname: HOST,
            port: PORT,
            path,
            method,
            headers: {
                "Content-Type": "application/json",
                ...(data && {
                    "Content-Length": Buffer.byteLength(data)
                }),
                ...(token && {
                    Authorization: `Bearer ${token}`
                })
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = "";

            res.on("data", chunk => {
                responseBody += chunk;
            });

            res.on("end", () => {
                const end = process.hrtime.bigint();

                resolve({
                    statusCode: res.statusCode,
                    body: responseBody,
                    latency: Number(end - start) / 1e6
                });
            });
        });

        req.on("error", reject);

        if (data) {
            req.write(data);
        }

        req.end();
    });
}


async function createUser(id) {
    const response = await request(
        "POST",
        "/api/users/register",
        {
            name: `Benchmark User ${id}`,
            email: `benchmark-${id}-${Date.now()}@example.com`,
            password: "password123"
        }
    );

    if (response.statusCode !== 201) {
        throw new Error(
            `User creation failed: ${response.statusCode} ${response.body}`
        );
    }

    return JSON.parse(response.body).token;
}


async function createTool(token, ownerId, toolNumber) {
    const response = await request(
        "POST",
        "/api/tools",
        {
            toolName: `Benchmark Tool ${ownerId}-${toolNumber}`,
            description: "Performance benchmark tool",
            location: "Mysuru",
            images: [
                "https://example.com/tool.jpg"
            ],
            pricePerHour: 100
        },
        token
    );

    if (response.statusCode !== 201) {
        throw new Error(
            `Tool creation failed: ${response.statusCode} ${response.body}`
        );
    }

    return JSON.parse(response.body).addNewTool._id;
}


async function main() {

    console.log("Preparing rental benchmark...");
    console.log(`Owners: ${CONCURRENCY}`);
    console.log(`Renters: ${CONCURRENCY}`);
    console.log(`Tools per owner: ${TOOLS_PER_OWNER}`);
    console.log(
        `Total rental requests: ${CONCURRENCY * TOOLS_PER_OWNER}`
    );
    console.log();


    // -----------------------------------------
    // 1. Create owners
    // -----------------------------------------

    const owners = [];

    for (let i = 0; i < CONCURRENCY; i++) {

        const token = await createUser(`owner-${i}`);

        owners.push(token);
    }


    // -----------------------------------------
    // 2. Create renters
    // -----------------------------------------

    const renters = [];

    for (let i = 0; i < CONCURRENCY; i++) {

        const token = await createUser(`renter-${i}`);

        renters.push(token);
    }


    // -----------------------------------------
    // 3. Create tools
    // -----------------------------------------

    const tools = [];

    for (let owner = 0; owner < CONCURRENCY; owner++) {

        for (let i = 0; i < TOOLS_PER_OWNER; i++) {

            const toolId = await createTool(
                owners[owner],
                owner,
                i
            );

            tools.push(toolId);
        }
    }


    console.log("Preparation complete.");
    console.log("Starting rental benchmark...");
    console.log();


    // -----------------------------------------
    // 4. Concurrent rental requests
    // -----------------------------------------

    const requests = [];

    const benchmarkStart = process.hrtime.bigint();


    for (let i = 0; i < tools.length; i++) {

        // Use a renter different from the owner.
        // Since there are 10 owners and 10 renters,
        // renter (i + 1) % 10 cannot be the owner of
        // tool i's owner index.
        const renterIndex =
            (Math.floor(i / TOOLS_PER_OWNER) + 1) % CONCURRENCY;

        const renterToken = renters[renterIndex];

        requests.push(
            request(
                "POST",
                `/api/rentals/${tools[i]}/rent`,
                null,
                renterToken
            )
        );
    }


    const results = await Promise.all(requests);

    const benchmarkEnd = process.hrtime.bigint();


    // -----------------------------------------
    // 5. Calculate benchmark metrics
    // -----------------------------------------

    const totalTime =
        Number(benchmarkEnd - benchmarkStart) / 1e9;


    const successful = results.filter(
        result => result.statusCode === 201
    );

    const failed = results.filter(
        result => result.statusCode !== 201
    );


    // Show failures if any
    if (failed.length > 0) {

        console.log("\nFailed responses:");

        failed.slice(0, 10).forEach((result, index) => {

            console.log(
                `${index + 1}. Status: ${result.statusCode}, Body: ${result.body}`
            );
        });
    }


    const latencies = successful
        .map(result => result.latency)
        .sort((a, b) => a - b);


    if (latencies.length === 0) {

        throw new Error(
            "No successful rental requests. Check failed responses above."
        );
    }


    const percentile = (p) => {

        const index =
            Math.ceil((p / 100) * latencies.length) - 1;

        return latencies[Math.max(0, index)];
    };


    const average =
        latencies.reduce(
            (sum, value) => sum + value,
            0
        ) / latencies.length;


    // -----------------------------------------
    // 6. Results
    // -----------------------------------------

    console.log();
    console.log("========== RENTAL BENCHMARK ==========");

    console.log(
        `Total time: ${totalTime.toFixed(3)} s`
    );

    console.log(
        `Requests: ${results.length}`
    );

    console.log(
        `Successful: ${successful.length}`
    );

    console.log(
        `Failed: ${failed.length}`
    );

    console.log(
        `Throughput: ${(results.length / totalTime).toFixed(2)} req/s`
    );

    console.log();

    console.log(
        `Average: ${average.toFixed(2)} ms`
    );

    console.log(
        `p50: ${percentile(50).toFixed(2)} ms`
    );

    console.log(
        `p95: ${percentile(95).toFixed(2)} ms`
    );

    console.log(
        `p99: ${percentile(99).toFixed(2)} ms`
    );

    console.log(
        "======================================"
    );
}


main().catch(error => {

    console.error("Benchmark failed:");
    console.error(error);

    process.exit(1);
});
