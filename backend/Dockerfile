FROM openjdk:17-jdk-slim
COPY target/*.jar app.jar 
# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
