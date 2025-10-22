-- V1__init_es.sql
-- Tablas para el modelo en español (coinciden con las entidades)

-- Quices
CREATE TABLE quices (
  id         BIGSERIAL PRIMARY KEY,
  corte      VARCHAR(255) NOT NULL CHECK (corte IN ('C1','C2','C3A','C3B')),
  titulo     TEXT NOT NULL,
  es_activo  BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en  TIMESTAMP NULL
);

-- Plantillas de preguntas
CREATE TABLE question_templates (
  id               BIGSERIAL PRIMARY KEY,
  quiz_id          BIGINT NOT NULL REFERENCES quices(id) ON DELETE CASCADE,
  stem_md          TEXT NOT NULL,
  explanation_md   TEXT,
  family           VARCHAR(255) NOT NULL,
  param_schema     JSONB NOT NULL,
  option_schema    JSONB NOT NULL,
  correct_key      VARCHAR(255) NOT NULL,
  version          INT NOT NULL DEFAULT 1,
  difficulty       VARCHAR(255)
);

-- Tópicos de plantilla (opcional, como en tu entidad)
CREATE TABLE question_template_topics (
  template_id  BIGINT NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
  topic        VARCHAR(255) NOT NULL
);

-- Intentos
CREATE TABLE intento_quiz (
  id             BIGSERIAL PRIMARY KEY,
  quiz_id        BIGINT NOT NULL REFERENCES quices(id) ON DELETE CASCADE,
  student_id     BIGINT NOT NULL,
  seed           BIGINT NOT NULL,
  generator_version VARCHAR(255) NOT NULL DEFAULT 'v1',
  started_at     TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at   TIMESTAMP,
  status         VARCHAR(255) NOT NULL CHECK (status IN ('EN_PROGRESO','PRESENTADO','CANCELADO')),
  max_points     NUMERIC(38,2),
  score_points   NUMERIC(38,2),
  score          NUMERIC(38,2),
  time_limit_sec INTEGER,
  submitted_ip   VARCHAR(255),
  user_agent     VARCHAR(255)
);

CREATE INDEX ix_intentos_quiz ON intento_quiz(quiz_id);
CREATE INDEX ix_intentos_estudiante ON intento_quiz(student_id);

-- Instancias de preguntas
CREATE TABLE instancias_pregunta (
  id               BIGSERIAL PRIMARY KEY,
  attempt_id       BIGINT NOT NULL REFERENCES intento_quiz(id) ON DELETE CASCADE,
  template_id      BIGINT NOT NULL REFERENCES question_templates(id),
  stem_md          TEXT NOT NULL,
  params           JSONB NOT NULL,
  opciones         JSONB NOT NULL,
  llave_correcta   VARCHAR(255) NOT NULL
);

-- Respuestas
CREATE TABLE respuestas (
  id                     BIGSERIAL PRIMARY KEY,
  instancia_pregunta_id  BIGINT NOT NULL REFERENCES instancias_pregunta(id) ON DELETE CASCADE,
  chosen_key             VARCHAR(255) NOT NULL,
  is_correct             BOOLEAN NOT NULL
);
