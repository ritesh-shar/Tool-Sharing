const http = require("http");

const HOST = "localhost";
const PORT = 5000;

const REQUESTS = 500;
const CONCURRENCY = 25;

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


async function createUser() {
    const response = await request(
        "POST",
        "/api/users/register",
        {
            name: "API Benchmark User",
            email: `api-benchmark-${Date.now()}@example.com`,
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


async function createTool(token) {
    const response = await request(
        "POST",
        "/api/tools",
        {
            toolName: `API Benchmark Tool ${Date.now()}`,
            description: "Tool created for API benchmark",
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


async function runBenchmark(name, requestFunction) {

    console.log(`\n========== ${name} ==========`);

    const results = [];

    let completed = 0;

    const benchmarkStart = process.hrtime.bigint();


    async function worker() {

        while (true) {

            const index = completed++;

            if (index >= REQUESTS) {
                return;
            }

            try {
                const result = await requestFunction();
                results.push(result);
            } catch (error) {
                results.push({
                    statusCode: 0,
                    latency: null,
                    error: error.message
                });
            }
        }
    }


    const workers = [];

    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);


    const benchmarkEnd = process.hrtime.bigint();

    const totalTime =
        Number(benchmarkEnd - benchmarkStart) / 1e9;


    const successful = results.filter(
        result => result.statusCode >= 200 &&
                  result.statusCode < 300
    );

    const failed = results.filter(
        result => !(result.statusCode >= 200 &&
                    result.statusCode < 300)
    );


    const latencies = successful
        .map(result => result.latency)
        .sort((a, b) => a - b);


    if (latencies.length === 0) {
        console.log("No successful requests.");
        return;
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


    console.log(`Requests: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);

    console.log(
        `Throughput: ${(results.length / totalTime).toFixed(2)} req/s`
    );

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
        `Total time: ${totalTime.toFixed(3)} s`
    );

    console.log(
        "======================================"
    );
}


async function main() {

    console.log("Preparing API benchmark...");

    const token = await createUser();

    await createTool(token);

    console.log("Preparation complete.");

    console.log(
        `Requests per endpoint: ${REQUESTS}`
    );

    console.log(
        `Concurrency: ${CONCURRENCY}`
    );


    // -----------------------------------------
    // 1. Browse tools
    // -----------------------------------------

    await runBenchmark(
        "GET /api/tools",
        () => request(
            "GET",
            "/api/tools"
        )
    );


    // -----------------------------------------
    // 2. Rental history
    // -----------------------------------------

    await runBenchmark(
        "GET /api/rentals/myrentals",
        () => request(
            "GET",
            "/api/rentals/myrentals",
            null,
            token
        )
    );


    // -----------------------------------------
    // 3. Create tools
    // -----------------------------------------

    await runBenchmark(
        "POST /api/tools",
        () => request(
            "POST",
            "/api/tools",
            {
                toolName: `Benchmark Tool ${Date.now()}-${Math.random()}`,
                description: "Performance benchmark tool",
                location: "Mysuru",
                images: [
                    "https://example.com/tool.jpg"
                ],
                pricePerHour: 100
            },
            token
        )
    );


    console.log("\nAPI benchmark complete.");
}


main().catch(error => {

    console.error("\nBenchmark failed:");
    console.error(error);

    process.exit(1);
});
