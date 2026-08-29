const http = require("http");

const HOST = "localhost";
const PORT = 5000;

const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;
const TOOLS_TO_CREATE = 5000;

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
            name: "DB Benchmark User",
            email: `db-benchmark-${Date.now()}@example.com`,
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


async function createTools(token) {

    console.log(`Creating ${TOOLS_TO_CREATE} tools...`);

    const start = Date.now();

    for (let i = 1; i <= TOOLS_TO_CREATE; i++) {

        const response = await request(
            "POST",
            "/api/tools",
            {
                toolName: `DB Benchmark Tool ${i}`,
                description: "Database scalability benchmark tool",
                location: i % 2 === 0 ? "Mysuru" : "Bangalore",
                images: [
                    "https://example.com/tool.jpg"
                ],
                pricePerHour: (i % 5 + 1) * 50
            },
            token
        );

        if (response.statusCode !== 201) {
            throw new Error(
                `Tool creation failed at ${i}: ${response.statusCode} ${response.body}`
            );
        }

        if (i % 500 === 0) {
            console.log(`${i}/${TOOLS_TO_CREATE} tools created`);
        }
    }

    const elapsed = (Date.now() - start) / 1000;

    console.log(
        `Finished creating tools in ${elapsed.toFixed(2)} seconds`
    );
}


async function runBenchmark(name, path) {

    console.log(`\n========== ${name} ==========`);
    console.log(`Endpoint: GET ${path}`);
    console.log(`Requests: ${TOTAL_REQUESTS}`);
    console.log(`Concurrency: ${CONCURRENCY}`);

    const results = [];
    let nextRequest = 0;

    const benchmarkStart = process.hrtime.bigint();

    async function worker() {

        while (true) {

            const index = nextRequest++;

            if (index >= TOTAL_REQUESTS) {
                return;
            }

            try {

                const result = await request(
                    "GET",
                    path
                );

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
        result =>
            result.statusCode >= 200 &&
            result.statusCode < 300
    );

    const failed = results.filter(
        result =>
            !(result.statusCode >= 200 &&
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

    console.log("Preparing database scalability benchmark...");

    const token = await createUser();

    await createTools(token);

    console.log("\nDatabase preparation complete.");
    console.log("Starting scalability tests...");


    // 1. First page
    await runBenchmark(
        "PAGE 1",
        "/api/tools?page=1&limit=10"
    );


    // 2. Page 100
    await runBenchmark(
        "PAGE 100",
        "/api/tools?page=100&limit=10"
    );


    // 3. Page 500
    await runBenchmark(
        "PAGE 500",
        "/api/tools?page=500&limit=10"
    );


    // 4. Location filter
    await runBenchmark(
        "LOCATION FILTER",
        "/api/tools?location=Mysuru&page=1&limit=10"
    );


    // 5. Price filter
    await runBenchmark(
        "PRICE FILTER",
        "/api/tools?minPrice=50&maxPrice=150&page=1&limit=10"
    );


    console.log("\nDatabase scalability benchmark complete.");
}


main().catch(error => {

    console.error("\nBenchmark failed:");
    console.error(error);

    process.exit(1);
});
