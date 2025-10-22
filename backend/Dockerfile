# ===== Builder =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copiamos wrapper + metadata primero (mejor cache)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./
# Si usas version catalog:
# COPY gradle/libs.versions.toml gradle/libs.versions.toml

RUN chmod +x gradlew

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

# ===== Runner =====
# (elige una base minimal; temurin jre es OK, distroless es más seguro)
FROM eclipse-temurin:21-jre AS runner
# Alternativas:
# FROM gcr.io/distroless/java21-debian12:nonroot
# FROM registry.access.redhat.com/ubi9/openjdk-21-runtime

WORKDIR /app
# Copiamos el directorio quarkus-app completo
COPY --from=build /workspace/build/quarkus-app/ /app/

# Seguridad: usuario no root
RUN useradd -u 1001 quarkus && chown -R quarkus:quarkus /app
USER 1001

# Red: escuchar en todas las interfaces (también lo puedes setear en JAVA_OPTS)
ENV QUARKUS_HTTP_HOST=0.0.0.0
# JVM amigable con contenedores (ajusta a tu memoria)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

EXPOSE 8080
# Para fast-jar se ejecuta quarkus-run.jar dentro de /app
CMD ["sh","-lc","exec java $JAVA_OPTS -jar quarkus-run.jar"]
