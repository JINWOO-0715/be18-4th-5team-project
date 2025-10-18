FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests
FROM eclipse-temurin:21-jre-alpine-3.22
ARG BUILD_PORT=8080
ENV TZ=Asia/Seoul
ENV APP_PROFILE=${BUILD_PROFILE}
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE ${BUILD_PORT}
CMD ["java", "-jar", "app.jar", "--spring.profiles.active=${APP_PROFILE}"]
