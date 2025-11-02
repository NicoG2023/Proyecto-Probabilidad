-- V1__init_es.sql
-- =========================================
-- 1) Alumnos
-- =========================================
CREATE TABLE alumnos (
  id            BIGSERIAL PRIMARY KEY,
  keycloak_sub  VARCHAR(255) NOT NULL UNIQUE,
  username      VARCHAR(255),
  email         VARCHAR(255),
  created_at    TIMESTAMP     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX ix_alumnos_username ON alumnos(username);
CREATE INDEX ix_alumnos_email    ON alumnos(email);

-- =========================================
-- 2) Quices
-- =========================================
CREATE TABLE quices (
  id         BIGSERIAL PRIMARY KEY,
  corte      VARCHAR(255) NOT NULL CHECK (corte IN ('C1','C2','C3A','C3B')),
  titulo     TEXT NOT NULL,
  es_activo  BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en  TIMESTAMP NULL
);

-- =========================================
-- 3) Plantillas de preguntas
-- =========================================
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

CREATE TABLE question_template_topics (
  template_id  BIGINT NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
  topic        VARCHAR(255) NOT NULL
);

-- =========================================
-- 4) Intentos
-- =========================================
CREATE TABLE intento_quiz (
  id                BIGSERIAL PRIMARY KEY,
  quiz_id           BIGINT NOT NULL REFERENCES quices(id) ON DELETE CASCADE,
  student_id        BIGINT NOT NULL REFERENCES alumnos(id),  -- FK al alumno
  seed              BIGINT NOT NULL,
  generator_version VARCHAR(255) NOT NULL DEFAULT 'v1',
  started_at        TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at      TIMESTAMP,
  status            VARCHAR(255) NOT NULL CHECK (status IN ('EN_PROGRESO','PRESENTADO','CANCELADO')),
  max_points        NUMERIC(38,2),
  score_points      NUMERIC(38,2),
  score             NUMERIC(38,2),
  time_limit_sec    INTEGER,
  submitted_ip      VARCHAR(255),
  user_agent        VARCHAR(255)
);

CREATE INDEX ix_intentos_quiz        ON intento_quiz(quiz_id);
CREATE INDEX ix_intentos_estudiante  ON intento_quiz(student_id);

-- =========================================
-- 5) Instancias de preguntas
--    OJO: la columna correcta es intento_id (no attempt_id)
-- =========================================
CREATE TABLE instancias_pregunta (
  id              BIGSERIAL PRIMARY KEY,
  intento_id      BIGINT NOT NULL REFERENCES intento_quiz(id) ON DELETE CASCADE,
  template_id     BIGINT NOT NULL REFERENCES question_templates(id),
  stem_md         TEXT   NOT NULL,
  params          JSONB  NOT NULL,
  opciones        JSONB  NOT NULL,                          -- vacío {} para abiertas
  llave_correcta  VARCHAR(255),                             -- NULL en abiertas
  -- NUEVO: tipo de instancia y valor correcto serializado
  tipo            VARCHAR(20) NOT NULL
                   CHECK (tipo IN ('MCQ','OPEN_NUM','OPEN_TEXT')),
  correct_value   JSONB                                     -- p.ej. {"type":"number","value":0.1234,...}
);

-- =========================================
-- 6) Respuestas
-- =========================================
CREATE TABLE respuestas (
  id                      BIGSERIAL PRIMARY KEY,
  instancia_pregunta_id   BIGINT NOT NULL REFERENCES instancias_pregunta(id) ON DELETE CASCADE,

  -- Para MCQ:
  chosen_key              VARCHAR(255),                     -- ahora opcional (NULL si es abierta)

  -- Para abiertas:
  chosen_value            TEXT,                             -- texto libre (OPEN_TEXT)
  chosen_number           NUMERIC(38,10),                   -- numérico (OPEN_NUM)

  -- Evaluación:
  is_correct              BOOLEAN NOT NULL DEFAULT FALSE,   -- bandera binaria
  partial_points          NUMERIC(10,4) NOT NULL DEFAULT 0  -- para extensiones (0..1)
);
