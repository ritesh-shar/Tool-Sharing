const http = require("http");

const HOST = "localhost";
const PORT = 5000;

const REQUESTS_PER_LEVEL = 500;

const CONCURRENCY_LEVELS = [10, 25, 50, 100];

function request(path) {
    return new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();

        const req = http.request(
            {
                hostname: HOST,
                port: PORT,
                path,
                method: "GET",
                headers: {
                    Connection: "close"
                }
            },
            (res) => {
                res.resume();

                res.on("end", () => {
                    const end = process.hrtime.bigint();

                    resolve({
                        statusCode: res.statusCode,
                        latency: Number(end - start) / 1e6
                    });
                });
            }
        );

        req.on("error", reject);
        req.end();
    });
}


async function runStressTest(concurrency) {

    console.log(`\n========== CONCURRENCY ${concurrency} ==========`);

    const results = [];
    let nextRequest = 0;

    const start = process.hrtime.bigint();

    async function worker() {

        while (true) {

            const index = nextRequest++;

            if (index >= REQUESTS_PER_LEVEL) {
                return;
            }

            try {

                const result = await request(
                    "/api/tools?page=1&limit=10"
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

    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    const end = process.hrtime.bigint();

    const totalTime =
        Number(end - start) / 1e9;

    const successful = results.filter(
        r => r.statusCode >= 200 && r.statusCode < 300
    );

    const failed = results.filter(
        r => !(r.statusCode >= 200 && r.statusCode < 300)
    );

    const latencies = successful
        .map(r => r.latency)
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
        `Success Rate: ${(
            successful.length / results.length * 100
        ).toFixed(2)}%`
    );

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

    console.log("Starting final stress benchmark...");
    console.log(`Requests per level: ${REQUESTS_PER_LEVEL}`);
    console.log(
        `Concurrency levels: ${CONCURRENCY_LEVELS.join(", ")}`
    );

    for (const concurrency of CONCURRENCY_LEVELS) {

        await runStressTest(concurrency);

        // Small pause between stress levels
        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );
    }

    console.log("\nFinal stress benchmark complete.");
}


main().catch(error => {

    console.error("\nBenchmark failed:");
    console.error(error);

    process.exit(1);
});
