# Stage 1: Build stage with JDK and SBT
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Install SBT manually
RUN apt-get update && apt-get install -y curl bash && \
    curl -L -o sbt-1.10.7.tgz https://github.com/sbt/sbt/releases/download/v1.10.7/sbt-1.10.7.tgz && \
    tar -xzvf sbt-1.10.7.tgz -C /usr/share && \
    ln -s /usr/share/sbt/bin/sbt /usr/local/bin/sbt && \
    rm sbt-1.10.7.tgz

# Copy configuration and dependency list to cache dependencies
COPY project/build.properties project/
COPY project/plugins.sbt project/
COPY build.sbt ./

# Run sbt update to pull down dependencies
RUN sbt update

# Copy application source code
COPY src/ ./src/

# Package the application as a single fat JAR
RUN sbt assembly

# Stage 2: Minimal runtime JRE stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Create a non-privileged system user for running the service securely
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Copy the packaged JAR file from the builder stage
COPY --from=builder /app/target/scala-2.13/metropolis-parking-assembly-0.1.0-SNAPSHOT.jar ./app.jar

# Default environment configuration variables
ENV APP_ENV=production
ENV HTTP_HOST=0.0.0.0
ENV HTTP_PORT=8080

# Expose port 8080
EXPOSE 8080

# Fail fast if the HTTP health endpoint stops responding.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail http://127.0.0.1:8080/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
