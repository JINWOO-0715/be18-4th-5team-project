# 🧱 1단계: 빌드용 스테이지
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY . .                      # ✅ 필요 시 .dockerignore 추가
RUN mvn clean package -DskipTests

# 🚀 2단계: 실행용 스테이지
FROM eclipse-temurin:21-jre-alpine-3.22

ARG BUILD_PORT=8080          # ✅ 사용 중인 포트 번호로 변경

ENV TZ=Asia/Seoul
ENV APP_PROFILE=${BUILD_PROFILE}

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE ${BUILD_PORT}
CMD ["java", "-jar", "app.jar", "--spring.profiles.active=${APP_PROFILE}"]
