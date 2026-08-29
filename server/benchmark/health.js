const http = require("http"); 
const HOST = "localhost"; 
const PORT = 5000; 
const TOTAL_REQUESTS = 1000; 
const CONCURRENCY = 50; 
function makeRequest() { 
    return new Promise((resolve, reject) => { 
        const start = process.hrtime.bigint(); 
        const req = http.get(`http://${HOST}:${PORT}/`, (res) => { 
            res.resume(); 
            res.on("end", () => { 
                const end = process.hrtime.bigint(); 
                resolve({ statusCode: res.statusCode, latency: Number(end - start) / 1e6 }); 
            }); 
        }); 
        req.on("error", reject); }); } 
        
async function runBenchmark() { 
        console.log("Starting benchmark..."); 
        console.log(`Requests: ${TOTAL_REQUESTS}`); 
        console.log(`Concurrency: ${CONCURRENCY}`); 
        console.log(); 
        const results = []; 
        const startTime = process.hrtime.bigint(); 
        let completed = 0; 
           
async function worker() { 
    while (true) { 
        const requestNumber = completed++; 
        if (requestNumber >= TOTAL_REQUESTS) { 
            return; } 
            try { 
                const result = await makeRequest(); 
                results.push(result); 
            } 
            catch (error) { 
                results.push({ statusCode: 0, latency: null, error: error.message }); 
            } 
        } 
    } 
    await Promise.all( Array.from( { 
        length: CONCURRENCY 
    }, () => worker() ) ); 
    const endTime = process.hrtime.bigint(); 
    const totalTime = Number(endTime - startTime) / 1e9; 
    const successful = results.filter( result => result.statusCode === 200 ); 
    const failed = results.filter( result => result.statusCode !== 200 ); 
    const latencies = successful .map(result => result.latency) .sort((a, b) => a - b); 
    const percentile = (p) => { const index = Math.ceil( (p / 100) * latencies.length ) - 1; 
        return latencies[Math.max(0, index)]; }; 
    const average = latencies.reduce((sum, value) => sum + value, 0) / latencies.length; 
    console.log("========== RESULTS =========="); 
    console.log(`Total time: ${totalTime.toFixed(3)} s`); 
    console.log(`Requests: ${TOTAL_REQUESTS}`); 
    console.log(`Successful: ${successful.length}`); 
    console.log(`Failed: ${failed.length}`); 
    console.log( `Throughput: ${(TOTAL_REQUESTS / totalTime).toFixed(2)} req/s` ); 
    console.log(); 
    console.log(`Average: ${average.toFixed(2)} ms`); 
    console.log(`p50: ${percentile(50).toFixed(2)} ms`); 
    console.log(`p95: ${percentile(95).toFixed(2)} ms`); 
    console.log(`p99: ${percentile(99).toFixed(2)} ms`); 
    console.log("============================="); } 
    runBenchmark().catch(console.error);
