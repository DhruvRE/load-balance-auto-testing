import os
from datetime import datetime
from functools import wraps
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

# -----------------------------
# Config
# -----------------------------
REQUEST_COUNT = Counter("flask_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("flask_request_latency_seconds", "Request latency", ["method", "endpoint"])

app = Flask(__name__)
CORS(app)

# -----------------------------
# Metrics Decorator
# -----------------------------
def observe_metrics(endpoint):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            start = time.time()
            resp = f(*args, **kwargs)
            latency = time.time() - start
            status = getattr(resp, "status_code", 200)
            REQUEST_COUNT.labels(request.method, endpoint, status).inc()
            REQUEST_LATENCY.labels(request.method, endpoint).observe(latency)
            return resp
        return wrapped
    return decorator

# Metrics endpoint
@app.route("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

# Health check
@app.route("/health", methods=["GET"])
@observe_metrics("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}, 200

# CPU burn endpoint (for load testing)
@app.route("/burn", methods=["GET"])
@observe_metrics("/burn")
def burn_cpu():
    # Query params: seconds (default 5), work (0|1) (1 = heavy math)
    try:
        seconds = float(request.args.get("seconds", "5"))
        work = int(request.args.get("work", "1"))
    except:
        seconds = 5.0
        work = 1
    
    end_time = time.time() + max(0.1, seconds)
    # Busy loop doing some math (keeps CPU busy)
    x = 0.0001
    while time.time() < end_time:
        if work:
            # Small math to prevent optimization
            x = (x * 1.000001) ** 1.000001
        else:
            # Short sleep to simulate lighter load
            time.sleep(0.01)
    
    return jsonify({
        "status": "burned",
        "seconds": seconds,
        "work": work,
        "timestamp": datetime.utcnow().isoformat()
    }), 200

# -----------------------------
# Entry
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051)