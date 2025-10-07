FROM grafana/k6:latest

WORKDIR /app

COPY loadtest.js /app/loadtest.js

CMD ["run", "/app/loadtest.js"]