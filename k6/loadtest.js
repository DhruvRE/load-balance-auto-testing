import http from 'k6/http';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';

export let burnLatency = new Trend("burn_latency");

export let options = {
  stages: [
    { duration: "30s", target: 10 },  // ramp to 10 VUs
    { duration: "60s", target: 50 },  // ramp to 50 VUs
    { duration: "60s", target: 200 }, // spike to 200 VUs - watch HPA
    { duration: "30s", target: 50 },  // cool down
    { duration: "30s", target: 0 }
  ],
  thresholds: {
    "http_req_duration": ["p(95)<2000"]
  }
};

export default function () {
  const url = __ENV.TARGET || "http://flask-load.monitoring.svc.cluster.local:5050/burn?seconds=3&work=1";  // Correct service, namespace, port
  let start = Date.now();
  let res = http.get(url);
  burnLatency.add(Date.now() - start);
  sleep(0.05);
}