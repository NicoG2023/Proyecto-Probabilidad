-- Tipos / enums (opcional: enum nativo de Postgres)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cut_type') THEN
    CREATE TYPE cut_type AS ENUM ('C1','C2','C3A','C3B');
  END IF;
END$$;

-- Tabla estudiantes
CREATE TABLE students (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  auth_provider   TEXT NOT NULL,
  auth_provider_id TEXT NOT NULL,
  UNIQUE (auth_provider, auth_provider_id)
);

-- Quizzes
CREATE TABLE quizzes (
  id         BIGSERIAL PRIMARY KEY,
  corte      cut_type NOT NULL,                 -- enum: C1,C2,C3A,C3B
  titulo     TEXT NOT NULL,
  es_activo  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Plantillas de preguntas
CREATE TABLE question_templates (
  id               BIGSERIAL PRIMARY KEY,
  quiz_id          BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  stem_md          TEXT NOT NULL,               -- enunciado con placeholders
  explanation_md   TEXT,
  family           TEXT NOT NULL,               -- multinomial, hipergeom, etc.
  param_schema     JSONB NOT NULL,              -- rangos
  option_schema    JSONB NOT NULL,              -- cómo construir A,B,C,D
  correct_key      TEXT NOT NULL                -- "A".."D"
);

-- Intentos
CREATE TABLE quiz_attempts (
  id          BIGSERIAL PRIMARY KEY,
  quiz_id     BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  seed        BIGINT NOT NULL,
  started_at  TIMESTAMP NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP,
  score       NUMERIC(5,2) DEFAULT NULL,
  status      TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUBMITTED'))
);

-- Instancias de preguntas (materializadas)
CREATE TABLE question_instances (
  id               BIGSERIAL PRIMARY KEY,
  attempt_id       BIGINT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  template_id      BIGINT NOT NULL REFERENCES question_templates(id),
  stem_md          TEXT NOT NULL,           -- ya interpolado
  params           JSONB NOT NULL,
  options          JSONB NOT NULL,          -- {"A":"..","B":"..",...}
  correct_key      TEXT NOT NULL
);

-- Respuestas
CREATE TABLE answers (
  id                    BIGSERIAL PRIMARY KEY,
  question_instance_id  BIGINT NOT NULL REFERENCES question_instances(id) ON DELETE CASCADE,
  chosen_key            TEXT,
  is_correct            BOOLEAN NOT NULL,
  answered_at           TIMESTAMP DEFAULT now()
);

-- Índices útiles
CREATE INDEX ix_qi_params_gin  ON question_instances USING GIN (params);
CREATE INDEX ix_qi_opts_gin    ON question_instances USING GIN (options);
CREATE INDEX ix_attempts_student ON quiz_attempts(student_id);
CREATE INDEX ix_attempts_quiz    ON quiz_attempts(quiz_id);
