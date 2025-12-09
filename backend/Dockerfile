# ===== Builder =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copiamos wrapper + metadata primero (mejor cache)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./

# 🔧 ARREGLO: quitar CRLF de Windows y dar permisos de ejecución
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# Pre-calentamos dependencias (cache Gradle)
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    ./gradlew --no-daemon dependencies || true

# Código de la app
COPY src ./src

# Build oficial Quarkus (fast-jar), sin tests
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    ./gradlew --no-daemon quarkusBuild -Dquarkus.package.type=fast-jar -x test
