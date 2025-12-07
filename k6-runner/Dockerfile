FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git

ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org

RUN go install go.k6.io/xk6/cmd/xk6@latest

# pin k6 to avoid breaking changes in latest
RUN xk6 build v1.0.0 \
  --with github.com/grafana/xk6-output-influxdb@main \
  --output /k6

FROM alpine:3.20
RUN apk add --no-cache ca-certificates bash curl jq
COPY --from=builder /k6 /usr/bin/k6
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
