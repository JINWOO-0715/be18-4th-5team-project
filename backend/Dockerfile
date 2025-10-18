# department-api/Dockerfile
# -------------------- 1단계: 빌드 환경 (패키징) --------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
COPY ./ /app
WORKDIR /app
# 패키징 수행: JAR 파일 이름은 pom.xml 또는 build.gradle 설정에 따라 다를 수 있습니다.
# 예시 이름: department-service-0.0.1-SNAPSHOT.jar
RUN [ "mvn", "package", "-DskipTests" ]

# -------------------- 2단계: 최종 실행 환경 (경량화) --------------------
FROM eclipse-temurin:21-jre-alpine-3.22
# 1단계에서 생성된 JAR 파일만 복사합니다.
COPY --from=builder /app/target/4th-backedn-0.0.1-SNAPSHOT.jar /root/app.jar

ARG BUILD_PROFILE=dev
ENV APP_PROFILE=${BUILD_PROFILE}
EXPOSE 8088
WORKDIR /root
# JAR 파일 실행
CMD [ "java", "-jar", "app.jar", "--spring.profiles.active=${APP_PROFILE}" ]
