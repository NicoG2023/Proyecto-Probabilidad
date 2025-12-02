// src/pages/Estudiante/EstudiantePracticaQuizPage.tsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EstudianteAPI as API } from "../../api/estudianteApi";
import type {
  PracticeQuestionDTO,
  PracticeCheckResultDTO,
} from "../../api/estudianteApi";
import {
  PRACTICE_TEMPLATES,
  type PracticeCorte,
} from "../../constants/practiceTemplates";
import { useAuthStrict } from "../../auth/AuthContext";
import { MathExpressionInput } from "../../components/MathExpressionInput";

import "katex/dist/katex.min.css";
import { MathInline, MathBlock } from "../../utils/MathText";

type ParamsState = Record<string, any>;

type QuestionState = {
  templateId: number;
  label: string;

  question: PracticeQuestionDTO | null;
  params: ParamsState;
  loading: boolean;
  error: string | null; // errores de red / validación

  // ahora la respuesta es una expresión (LaTeX / infix) o texto
  answer: string;
  checking: boolean;
  result: PracticeCheckResultDTO | null;
};

// Configuración de sliders por parámetro
type SliderConfig = {
  min: number;
  max: number;
  step: number;
  asPercent?: boolean; // mostrar 0.25 como "25 %"
  label?: string;
};

const PARAM_SLIDER_CONFIG: Record<string, SliderConfig> = {
  // P1 – Multinomial contagios
  p_covid: {
    min: 0.2,
    max: 0.35,
    step: 0.01,
    asPercent: true,
    label: "Probabilidad de contagio de Covid-19",
  },
  p_omicron: {
    min: 0.25,
    max: 0.4,
    step: 0.01,
    asPercent: true,
    label: "Probabilidad de contagio de Omicron",
  },
  p_n1h1: {
    min: 0.3,
    max: 0.45,
    step: 0.01,
    asPercent: true,
    label: "Probabilidad de contagio de N1H1",
  },
  x_covid: {
    min: 0,
    max: 5,
    step: 1,
    label: "Cantidad de contagiados de Covid-19",
  },
  x_omicron: {
    min: 0,
    max: 5,
    step: 1,
    label: "Cantidad de contagiados de Omicron",
  },
  x_n1h1: {
    min: 0,
    max: 5,
    step: 1,
    label: "Cantidad de contagiados de N1H1",
  },

  // P2 – Combinatoria por grupos
  jovenes_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Jóvenes",
  },
  mayores_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Mayores",
  },
  ninos_tot: {
    min: 1,
    max: 10,
    step: 1,
    label: "Total de Niños",
  },
  x_jov: {
    min: 1,
    max: 10,
    step: 1,
    label: "Jóvenes que se contagian",
  },
  x_may: {
    min: 1,
    max: 10,
    step: 1,
    label: "Mayores que se contagian",
  },
  x_nino: {
    min: 1,
    max: 10,
    step: 1,
    label: "Niños que se contagian",
  },

  // P3 – Serie 3 de 4
  gana: { min: 1, max: 4, step: 1 },
  total: { min: 1, max: 7, step: 1 },
  pA: { min: 0.5, max: 0.7, step: 0.01, asPercent: true },

  // P4 – Poisson aprox
  m: { min: 1000, max: 20000, step: 500 },
  pmin: { min: 0.0001, max: 0.0003, step: 0.00001 },
  t: { min: 1, max: 10, step: 1 },
};

// Claves que NO queremos mostrar como sliders (pero sí enviar al backend)
const HIDDEN_PARAMS = new Set(["p_jov", "p_may", "p_nino"]);

/**
 * Validaciones de parámetros por plantilla.
 * - P1: p_covid + p_omicron + p_n1h1 = 1.
 * - P2: no se pueden contagiar más personas de las que entran.
 */
function validateParams(_templateId: number, params: ParamsState): string | null {
  // --- Regla multinomial P1 ---
  const hasMultParams =
    params.p_covid !== undefined &&
    params.p_omicron !== undefined &&
    params.p_n1h1 !== undefined;

  if (hasMultParams) {
    const p1 = Number(params.p_covid ?? 0);
    const p2 = Number(params.p_omicron ?? 0);
    const p3 = Number(params.p_n1h1 ?? 0);
    const sum = p1 + p2 + p3;
    if (Math.abs(sum - 1) > 1e-6) {
      return "Las probabilidades p_covid, p_omicron y p_n1h1 deben sumar 100 %.";
    }
  }

  // --- Regla combinatoria P2: x_* <= *_tot ---
  const errors: string[] = [];

  const pairs: Array<{
    xKey: keyof ParamsState;
    totKey: keyof ParamsState;
    label: string;
  }> = [
    { xKey: "x_jov", totKey: "jovenes_tot", label: "jóvenes" },
    { xKey: "x_may", totKey: "mayores_tot", label: "mayores" },
    { xKey: "x_nino", totKey: "ninos_tot", label: "niños" },
  ];

  for (const { xKey, totKey, label } of pairs) {
    if (params[xKey] !== undefined && params[totKey] !== undefined) {
      const xVal = Number(params[xKey]);
      const totVal = Number(params[totKey]);
      if (xVal > totVal) {
        errors.push(
          `No pueden contagiarse más ${label} de los que ingresan ( ${String(
            xKey
          )} > ${String(totKey)} ).`
        );
      }
    }
  }

  if (errors.length > 0) {
    return errors.join(" ");
  }

  return null;
}

export default function EstudiantePracticaQuizPage() {
  const { ready, authenticated } = useAuthStrict();
  const { corte } = useParams<{ corte: string }>();
  const corteCode = (corte ?? "C1") as PracticeCorte;

  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);

  // Helper: refrescar enunciado de una pregunta con params concretos
  const refreshQuestionWithParams = async (
    templateId: number,
    params: ParamsState
  ) => {
    // Marcamos loading para esa pregunta
    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId ? { ...q, loading: true, result: null } : q
      )
    );
    try {
      const dto = await API.renderPractica(templateId, params);
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? {
                ...q,
                question: dto,
                // mantenemos los mismos params que eligió el estudiante
                params,
                loading: false,
                error: null,
              }
            : q
        )
      );
    } catch (e: any) {
      console.error(e);
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? {
                ...q,
                loading: false,
                error:
                  e?.message ??
                  "No se pudo actualizar el enunciado para estos parámetros.",
              }
            : q
        )
      );
    }
  };

  // Cargar TODAS las preguntas de ese corte
  useEffect(() => {
    if (!ready || !authenticated || !corteCode) return;

    const templates = PRACTICE_TEMPLATES[corteCode] ?? [];
    if (templates.length === 0) {
      setPageError("Aún no hay preguntas de práctica para este corte.");
      setQuestions([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoadingPage(true);
        setPageError(null);
        const items: QuestionState[] = await Promise.all(
          templates.map(async (tpl) => {
            try {
              const q = await API.renderPractica(tpl.id, {});
              return {
                templateId: tpl.id,
                label: tpl.label,
                question: q,
                params: q.params ?? {},
                loading: false,
                error: null,
                answer: "",
                checking: false,
                result: null,
              };
            } catch (e: any) {
              console.error(e);
              return {
                templateId: tpl.id,
                label: tpl.label,
                question: null,
                params: {},
                loading: false,
                error:
                  e?.message ??
                  "No se pudo cargar esta pregunta de práctica.",
                answer: "",
                checking: false,
                result: null,
              };
            }
          })
        );
        if (!mounted) return;
        setQuestions(items);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setPageError(
          e?.message ?? "No se pudieron cargar las preguntas de práctica."
        );
        setQuestions([]);
      } finally {
        mounted && setLoadingPage(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated, corteCode]);

  // Cambiar parámetros de UNA pregunta
  const handleParamChange = (
    templateId: number,
    key: string,
    value: string | number
  ) => {
    const current = questions.find((q) => q.templateId === templateId);
    const baseParams: ParamsState = current?.params ?? {};
    const newParams: ParamsState = { ...baseParams, [key]: value };

    const validationError = validateParams(templateId, newParams);

    // Actualizamos estado (params + error de validación)
    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId
          ? {
              ...q,
              params: newParams,
              error: validationError,
            }
          : q
      )
    );

    // Si hay error de parámetros, NO refrescamos enunciado
    if (validationError) return;

    // Si son válidos, refrescamos automáticamente el enunciado
    void refreshQuestionWithParams(templateId, newParams);
  };

  // Cambiar respuesta de UNA pregunta (expresión o texto)
  const handleAnswerChange = (templateId: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId ? { ...q, answer: value } : q
      )
    );
  };

  // Comprobar respuesta de UNA pregunta
  const handleCheck = async (templateId: number) => {
    const current = questions.find((q) => q.templateId === templateId);
    if (!current || !current.question) return;

    const validationError = validateParams(templateId, current.params);
    if (validationError) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId ? { ...q, error: validationError } : q
        )
      );
      return;
    }

    if (!current.answer || current.answer.trim() === "") {
      alert("Por favor, escribe tu respuesta.");
      return;
    }

    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId ? { ...q, checking: true } : q
      )
    );

    try {
      const res = await API.checkPractica(
        templateId,
        current.params,
        current.answer.trim()
      );
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? { ...q, result: res, checking: false }
            : q
        )
      );
    } catch (e: any) {
      console.error(e);
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? {
                ...q,
                checking: false,
                result: null,
                error: e?.message ?? "No se pudo verificar la respuesta.",
              }
            : q
        )
      );
    }
  };

  const tituloCorte =
    corteCode === "C1"
      ? "Corte 1"
      : corteCode === "C2"
      ? "Corte 2"
      : corteCode === "C3A"
      ? "Corte 3 – Primer Modelo (C3A)"
      : "Corte 3 – Segundo Modelo (C3B)";

  return (
    <section className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Práctica de Quiz</h1>
            <p className="text-sm text-gray-600">
              {tituloCorte} · Todas las preguntas
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-black hover:bg-gray-100"
          >
            ← Volver al panel
          </Link>
        </header>

        {/* ESTADOS GLOBALES */}
        {loadingPage && <Loader />}

        {!loadingPage && pageError && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-100 p-3 text-sm text-amber-800">
            {pageError}
          </div>
        )}

        {!loadingPage && !pageError && questions.length > 0 && (
          <div className="space-y-8">
            {questions.map((q, idx) => {
              const explicacion =
                q.result?.explanationMd ?? q.question?.explanationMd ?? null;

              // Filtrar parámetros que queremos mostrar como sliders/inputs
              const visibleParamsEntries = Object.entries(q.params).filter(
                ([key]) => !HIDDEN_PARAMS.has(key)
              );

              // --- NUEVO: mirar metadata de respuesta para saber si es texto plano ---
              const answerMeta = (q.question as any)?.answerMeta;
              const isPlainTextAnswer =
                answerMeta?.mode === "open_text" &&
                (answerMeta?.format === "plain" ||
                  answerMeta?.textFormat === "plain");

              return (
                <article
                  key={q.templateId}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="mb-2 text-sm font-semibold text-gray-800">
                    Pregunta P{idx + 1} · {q.label}
                  </h2>

                  {/* Error puntual de esta pregunta (validación o red) */}
                  {q.error && (
                    <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                      {q.error}
                    </div>
                  )}

                  {/* ENUNCIADO */}
                  {q.question && (
                    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-2 text-xs font-semibold text-gray-700">
                        Enunciado
                      </h3>
                      <MathBlock text={q.question.stemMd ?? ""} />
                    </div>
                  )}

                  {/* PARÁMETROS */}
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-gray-700">
                        Parámetros de la pregunta
                      </h3>
                      <span className="text-[10px] text-gray-500">
                        El enunciado se actualiza automáticamente al mover los
                        sliders.
                      </span>
                    </div>

                    {visibleParamsEntries.length === 0 ? (
                      <p className="text-[11px] text-gray-500">
                        Esta pregunta no tiene parámetros configurables.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {visibleParamsEntries.map(([key, value]) => {
                          const isNumber = typeof value === "number";
                          const sliderCfg = isNumber
                            ? PARAM_SLIDER_CONFIG[key]
                            : undefined;
                          const numericValue = isNumber
                            ? (value as number)
                            : Number(value);

                          if (sliderCfg) {
                            const displayVal = sliderCfg.asPercent
                              ? `${(numericValue * 100).toFixed(0)} %`
                              : `${numericValue}`;

                            return (
                              <div
                                key={key}
                                className="flex flex-col gap-1 text-[11px]"
                              >
                                <label className="font-medium text-gray-700">
                                  {sliderCfg.label ?? key}
                                </label>

                                <input
                                  type="range"
                                  className="w-full accent-blue-600"
                                  min={sliderCfg.min}
                                  max={sliderCfg.max}
                                  step={sliderCfg.step}
                                  value={Number.isFinite(numericValue)
                                    ? numericValue
                                    : sliderCfg.min}
                                  onChange={(e) =>
                                    handleParamChange(
                                      q.templateId,
                                      key,
                                      Number(e.target.value)
                                    )
                                  }
                                />

                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                  <span>{sliderCfg.min}</span>
                                  <span className="font-mono text-gray-800">
                                    {displayVal}
                                  </span>
                                  <span>{sliderCfg.max}</span>
                                </div>
                              </div>
                            );
                          }

                          // Fallback: input numérico / texto clásico
                          return (
                            <div
                              key={key}
                              className="flex flex-col gap-1 text-[11px]"
                            >
                              <label className="font-medium text-gray-700">
                                {key}
                              </label>
                              <input
                                type={isNumber ? "number" : "text"}
                                className="rounded-lg border border-gray-300 bg.white px-2 py-1.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-blue-400"
                                value={value as any}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  handleParamChange(
                                    q.templateId,
                                    key,
                                    isNumber ? Number(raw) : raw
                                  );
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RESPUESTA DEL ESTUDIANTE */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="mb-3 text-xs font-semibold text-gray-700">
                      Tu respuesta
                      {isPlainTextAnswer ? "" : " (expresión)"}
                    </h3>

                    <div className="flex flex-col gap-3">
                      {isPlainTextAnswer ? (
                        // --- PREGUNTAS DE TEXTO PLANO (ej. "Ninguna de las anteriores") ---
                        <input
                          type="text"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-blue-400"
                          placeholder="Escribe tu respuesta (por ejemplo: Ninguna de las anteriores, N/A, NA, …)"
                          value={q.answer}
                          onChange={(e) =>
                            handleAnswerChange(q.templateId, e.target.value)
                          }
                        />
                      ) : (
                        // --- PREGUNTAS DE EXPRESIÓN MATEMÁTICA ---
                        <MathExpressionInput
                          value={q.answer}
                          onChange={(latex) =>
                            handleAnswerChange(q.templateId, latex)
                          }
                          placeholder={String.raw`\frac{(1+3+1)!}{1!3!1!}(0.25)^1(0.35)^3(0.3)^1`}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleCheck(q.templateId)}
                        disabled={q.checking || !q.answer}
                        className="self-start rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {q.checking ? "Verificando…" : "Comprobar respuesta"}
                      </button>
                    </div>

                    {/* FEEDBACK */}
                    {q.result && (
                      <div className="mt-4 text-sm">
                        {q.result.isCorrect ? (
                          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800">
                            ✅ ¡Correcto!
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
                            <div>❌ Respuesta incorrecta.</div>
                            {q.result.correctDisplay && (
                              <div className="text-xs">
                                <span className="opacity-70">
                                  Respuesta correcta:
                                </span>
                                <div className="mt-1">
                                  <MathBlock
                                    text={q.result.correctDisplay ?? ""}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* EXPLICACIÓN SOLO SI YA RESPONDIÓ */}
                  {q.result && explicacion && (
                    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <h3 className="mb-3 text-xs font-semibold text-blue-900">
                        Explicación paso a paso
                      </h3>
                      {explicacion
                        .split(/\n{2,}/)
                        .map((chunk, idx2) => (
                          <p key={idx2} className="mb-2 text-sm text-blue-900">
                            <MathInline text={chunk} />
                          </p>
                        ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Loader() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
