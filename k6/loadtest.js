import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom metrics
export let burnLatency = new Trend("burn_latency");
export let burnErrors = new Counter("burn_errors");

export let options = {
  stages: [
    { duration: "30s", target: 10 },   // Ramp up to 10 VUs
    { duration: "60s", target: 50 },   // Ramp up to 50 VUs
    { duration: "60s", target: 200 },  // Spike to 200 VUs - watch HPA scale
    { duration: "30s", target: 50 },   // Cool down to 50 VUs
    { duration: "30s", target: 0 }     // Ramp down to 0
  ],
  thresholds: {
    "http_req_duration": ["p(95)<2000"],  // 95% of requests should be below 2s
    "http_req_failed": ["rate<0.1"],      // Error rate should be below 10%
    "burn_latency": ["p(95)<3500"]        // 95% of burn operations should complete within 3.5s
  }
};

export default function () {
  // Target the Flask service in monitoring namespace on port 5051
  const url = __ENV.TARGET || "http://flask-load.monitoring.svc.cluster.local:5051/burn?seconds=3&work=1";
  
  let start = Date.now();
  let res = http.get(url);
  let duration = Date.now() - start;
  
  // Add custom metric
  burnLatency.add(duration);
  
  // Check response
  let checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
    'has burned status': (r) => {
      try {
        return JSON.parse(r.body).status === 'burned';
      } catch (e) {
        return false;
      }
    }
  });
  
  if (!checkResult) {
    burnErrors.add(1);
    console.log(`Error: Status ${res.status}, Body: ${res.body.substring(0, 100)}`);
  }
  
  sleep(0.05);
}

// Optional: Setup and teardown
export function setup() {
  console.log('Starting load test against Flask service...');
  console.log('Target URL: http://flask-load.monitoring.svc.cluster.local:5051/burn?seconds=3&work=1');
}

export function teardown(data) {
  console.log('Load test completed!');
}