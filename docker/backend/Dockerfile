FROM eclipse-temurin:21-jdk-alpine AS builder
RUN mkdir -p /app/backend /config
WORKDIR /app/backend
COPY ./backend/backend .
COPY ./config /config
RUN chmod +x gradlew && ./gradlew clean build -x test

FROM eclipse-temurin:21-jdk-alpine
RUN apk update && apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/backend/build/libs/*.jar app.jar
#RUN #chmod +x app.jar
EXPOSE 8080
ENTRYPOINT ["java" ,"-jar", "app.jar", "--server.port=8080"]
##ENTRYPOINT ["/bin/sh"]
#ENTRYPOINT ["sh", "-c", "while :; do sleep 1; done"]