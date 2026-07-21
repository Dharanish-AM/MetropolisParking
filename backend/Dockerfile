FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/scala-2.13/metropolis-parking-backend-assembly-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
