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
import type {
  ParamsState,
  SliderConfig,
  ParamsValidator,
} from "../../constants/practice/types";
import {
  PARAM_SLIDER_CONFIG_C1,
  validateParamsC1,
  PLACEHOLDER_EXPR_C1,
} from "../../constants/practice/paramsC1";
import {
  PARAM_SLIDER_CONFIG_C2,
  validateParamsC2,
  PLACEHOLDER_EXPR_C2,
} from "../../constants/practice/paramsC2";
import {
  PARAM_SLIDER_CONFIG_C3A,
  validateParamsC3A,
  PLACEHOLDER_EXPR_C3A,
} from "../../constants/practice/paramsC3A";
import {
  PARAM_SLIDER_CONFIG_C3B,
  validateParamsC3B,
  PLACEHOLDER_EXPR_C3B,
} from "../../constants/practice/paramsC3B";

type AnswerMode = "decimal_pair" | "expression_pair" | "default";

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

  answerError?: string | null;
  answerMode?: AnswerMode;
};

// Claves que NO queremos mostrar como sliders (pero sí enviar al backend)
const HIDDEN_PARAMS = new Set(["p_jov", "p_may", "p_nino"]);

function normalizeNumericPair(raw: string, decimals = 2): string | null {
  const parts = raw.split(",");
  if (parts.length !== 2) return null;

  const [leftRaw, rightRaw] = parts.map((p) => p.trim());
  const leftVal = Number(leftRaw);
  const rightVal = Number(rightRaw);

  if (!Number.isFinite(leftVal) || !Number.isFinite(rightVal)) {
    return null;
  }

  const leftNorm = leftVal.toFixed(decimals);
  const rightNorm = rightVal.toFixed(decimals);

  return `${leftNorm}, ${rightNorm}`;
}

// Mapeo de sliders y validadores por corte
const SLIDERS_BY_CORTE: Record<PracticeCorte, Record<string, SliderConfig>> = {
  C1: PARAM_SLIDER_CONFIG_C1,
  C2: PARAM_SLIDER_CONFIG_C2,
  C3A: PARAM_SLIDER_CONFIG_C3A,
  C3B: PARAM_SLIDER_CONFIG_C3B,
};

const VALIDATORS_BY_CORTE: Record<PracticeCorte, ParamsValidator> = {
  C1: validateParamsC1,
  C2: validateParamsC2,
  C3A: validateParamsC3A,
  C3B: validateParamsC3B,
};

const PLACEHOLDERS_BY_CORTE: Record<PracticeCorte, Record<string, string>> = {
  C1: PLACEHOLDER_EXPR_C1,
  C2: PLACEHOLDER_EXPR_C2,
  C3A: PLACEHOLDER_EXPR_C3A,
  C3B: PLACEHOLDER_EXPR_C3B,
};

export default function EstudiantePracticaQuizPage() {
  const { ready, authenticated } = useAuthStrict();
  const { corte } = useParams<{ corte: string }>();
  const rawCorte = (corte ?? "") as PracticeCorte;
  const corteCode: PracticeCorte =
    rawCorte === "C1" ||
    rawCorte === "C2" ||
    rawCorte === "C3A" ||
    rawCorte === "C3B"
      ? rawCorte
      : "C1";
  const sliderConfigForCorte =
    SLIDERS_BY_CORTE[corteCode] ?? ({} as Record<string, SliderConfig>);

  const validateParamsForCorte =
    VALIDATORS_BY_CORTE[corteCode] ??
    ((_: number, __: ParamsState) => null);

  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);

  function applyBoldHeadings(chunk: string): string {
    // ***Texto***  →  $ ... $ (mezcla de \textbf{...} + partes matemáticas)
    return chunk.replace(/\*\*\*(.+?)\*\*\*/gs, (_match, inner: string) => {
      // Buscamos sub-bloques tipo \[ ... \] dentro del heading
      const mathRegex = /\\\[(.*?)\\\]/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      const pieces: string[] = [];

      while ((m = mathRegex.exec(inner)) !== null) {
        const start = m.index!;
        const end = start + m[0].length;
        const mathInner = m[1]; // por ejemplo, "\Phi"

        // Texto antes de este bloque matemático
        const before = inner.slice(lastIndex, start);
        if (before.trim().length > 0) {
          // Lo envolvemos en \textbf{...}
          pieces.push(`\\textbf{${before}}`);
        }

        // Parte matemática (sin \[ \], solo el contenido)
        pieces.push(mathInner);

        lastIndex = end;
      }

      // Texto que queda después del último bloque \[...\]
      const after = inner.slice(lastIndex);
      if (after.trim().length > 0) {
        pieces.push(`\\textbf{${after}}`);
      }

      const math = pieces.join(" ");
      return `$${math}$`;
    });
  }

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
                answerMode: q.answerMode,
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

  const toggleAnswerMode = (templateId: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId
          ? {
              ...q,
              answerMode:
                q.answerMode === "expression_pair"
                  ? "decimal_pair"
                  : "expression_pair",
              // al cambiar de modo limpiamos respuesta y feedback
              answer: "",
              answerError: null,
              result: null,
            }
          : q
      )
    );
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
              const answerMeta = (q as any)?.answerMeta;
              const initialAnswerMode: AnswerMode =
                answerMeta?.mode === "mcq_auto_pair"
                  ? "decimal_pair"
                  : "default";
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
                answerError: null,
                answerMode: initialAnswerMode,
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
                answerError: null,
                answerMode: "default",
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

    const validationError = validateParamsForCorte(templateId, newParams);

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
        q.templateId === templateId
          ? {
              ...q,
              answer: value,
              // si está escribiendo, limpiamos error visual de respuesta
              answerError: null,
            }
          : q
      )
    );
  };

  const handleAnswerBlur = (templateId: number) => {
    const current = questions.find((q) => q.templateId === templateId);
    if (!current || !current.question) return;

    const answerMeta = (current.question as any)?.answerMeta;
    if (answerMeta?.mode !== "mcq_auto_pair") return;

    const raw = current.answer.trim();
    if (!raw) return;

    // En modo expresión NO normalizamos ni validamos aquí
    if (current.answerMode === "expression_pair") return;

    const decimals = answerMeta?.leftDecimals ?? 2;
    const normalized = normalizeNumericPair(raw, decimals);

    if (!normalized) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? {
                ...q,
                answerError:
                  "Debes escribir dos números separados por coma, por ejemplo: 0.12, 0.35",
              }
            : q
        )
      );
      return;
    }

    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId
          ? {
              ...q,
              answer: normalized,
              answerError: null,
            }
          : q
      )
    );
  };

  // Comprobar respuesta de UNA pregunta
  const handleCheck = async (templateId: number) => {
    const current = questions.find((q) => q.templateId === templateId);
    if (!current || !current.question) return;

    const answerMeta = (current.question as any)?.answerMeta;
    const rawAnswer = current.answer.trim();

    const isPairNumeric = answerMeta?.mode === "mcq_auto_pair";
    const isExpressionPair =
      isPairNumeric && current.answerMode === "expression_pair";

    // Validar que haya respuesta
    if (!rawAnswer) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? { ...q, answerError: "Por favor, escribe tu respuesta." }
            : q
        )
      );
      return;
    }

    let payloadAnswer = rawAnswer;
    if (isExpressionPair) {
      payloadAnswer = "__expr_pair__:" + rawAnswer;
    }

    // Validación de formato SOLO para par numérico en modo decimales
    if (
      answerMeta?.mode === "mcq_auto_pair" &&
      current.answerMode !== "expression_pair"
    ) {
      const minDecimals = answerMeta?.leftDecimals ?? 2;
      const decPattern = `\\d+\\.\\d{${minDecimals},}`;
      const pairRegex = new RegExp(
        `^\\s*-?${decPattern}\\s*,\\s*-?${decPattern}\\s*$`
      );

      if (!pairRegex.test(rawAnswer)) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.templateId === templateId
              ? {
                  ...q,
                  answerError: `Cada número debe tener al menos ${minDecimals} decimales. Ejemplo: 0.${"0".repeat(
                    minDecimals - 1
                  )}6, 0.${"0".repeat(minDecimals - 1)}35`,
                }
              : q
          )
        );
        return;
      }
    }

    const validationError = validateParamsForCorte(
      templateId,
      current.params
    );
    if (validationError) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.templateId === templateId
            ? { ...q, error: validationError }
            : q
        )
      );
      return;
    }

    setQuestions((prev) =>
      prev.map((q) =>
        q.templateId === templateId
          ? { ...q, checking: true, answerError: null }
          : q
      )
    );

    try {
      const res = await API.checkPractica(
        templateId,
        current.params,
        payloadAnswer
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

              // --- mirar metadata de respuesta ---
              const answerMeta = (q.question as any)?.answerMeta;
              const isPlainTextAnswer =
                answerMeta?.mode === "open_text" &&
                (answerMeta?.format === "plain" ||
                  answerMeta?.textFormat === "plain");
              const isPairNumeric = answerMeta?.mode === "mcq_auto_pair";
              const isMoneyNumeric =
                (answerMeta?.mode === "mcq_auto" ||
                  answerMeta?.mode === "open_numeric") &&
                (answerMeta?.prefix === "$" ||
                  answerMeta?.suffix?.includes("millones"));

              const isExpressionPair =
                isPairNumeric && q.answerMode === "expression_pair";

              const placeholderMapForCorte =
                PLACEHOLDERS_BY_CORTE[corteCode] ?? {};
              const answerPlaceholder =
                placeholderMapForCorte[q.templateId] ??
                String.raw`\frac{(1+3+1)!}{1!3!1!}(0.25)^1(0.35)^3(0.3)^1`; // fallback
              
              const correctDisplayRaw = q.result?.correctDisplay ?? null;
              // Si es par numérico y el alumno está en modo expresión, usamos el LaTeX del meta
              const correctForMode =
                isPairNumeric &&
                q.answerMode === "expression_pair" &&
                answerMeta?.latexPreview
                  ? (answerMeta.latexPreview as string)
                  : correctDisplayRaw;

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

                      {q.question.stemMd
                        ?.split(/\n{2,}/) // separamos por doble salto de línea en párrafos
                        .map((chunk, i) => (
                          <p key={i} className="mb-2 text-sm text-gray-900">
                            <MathInline text={chunk} />
                          </p>
                        ))}
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
                            ? sliderConfigForCorte[key]
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
                      {isPlainTextAnswer || isMoneyNumeric || isPairNumeric
                        ? ""
                        : " (expresión)"}
                    </h3>

                    {isPairNumeric && (
                      <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-600">
                        <span className="font-medium">Modo de respuesta:</span>
                        <button
                          type="button"
                          onClick={() => toggleAnswerMode(q.templateId)}
                          className="rounded-full border border-gray-300 px-2 py-1 text-[11px] hover:bg-gray-100"
                        >
                          {isExpressionPair
                            ? "Escribir decimales"
                            : "Escribir como expresión"}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {isPairNumeric ? (
                        isExpressionPair ? (
                          // === MODO 2: expresión con MathExpressionInput ===
                          <MathExpressionInput
                            value={q.answer}
                            onChange={(latex) =>
                              handleAnswerChange(q.templateId, latex)
                            }
                            placeholder={answerPlaceholder}
                          />
                        ) : (
                          // === MODO 1: decimales simples ===
                          <>
                            <input
                              type="text"
                              className={
                                "w-full rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 " +
                                (q.answerError
                                  ? "border-red-400 focus:ring-red-400"
                                  : "border-gray-300 focus:ring-blue-400")
                              }
                              placeholder="Escribe dos probabilidades separadas por coma, ej: 0.12, 0.35"
                              value={q.answer}
                              onChange={(e) =>
                                handleAnswerChange(
                                  q.templateId,
                                  e.target.value
                                )
                              }
                              onBlur={() => handleAnswerBlur(q.templateId)}
                            />
                            {q.answerError && (
                              <p className="text-xs text-red-500">
                                {q.answerError}
                              </p>
                            )}
                          </>
                        )
                      ) : isMoneyNumeric ? (
                        // --- Caso dinero: input con prefijo y sufijo ---
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">$</span>
                          <input
                            type="text"
                            className={
                              "flex-1 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 " +
                              (q.answerError
                                ? "border-red-400 focus:ring-red-400"
                                : "border-gray-300 focus:ring-blue-400")
                            }
                            placeholder="0.82"
                            value={q.answer}
                            onChange={(e) =>
                              handleAnswerChange(q.templateId, e.target.value)
                            }
                          />
                          <span className="text-xs text-gray-600">
                            millones
                          </span>
                          {q.answerError && (
                            <p className="text-xs text-red-500">
                              {q.answerError}
                            </p>
                          )}
                        </div>
                      ) : isPlainTextAnswer ? (
                        // === TEXTO PLANO (Ninguna de las anteriores, etc.) ===
                        <>
                          <input
                            type="text"
                            className={
                              "w-full rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-1 " +
                              (q.answerError
                                ? "border-red-400 focus:ring-red-400"
                                : "border-gray-300 focus:ring-blue-400")
                            }
                            placeholder="Escribe tu respuesta (por ejemplo: Ninguna de las anteriores, N/A, NA, …)"
                            value={q.answer}
                            onChange={(e) =>
                              handleAnswerChange(q.templateId, e.target.value)
                            }
                          />
                          {q.answerError && (
                            <p className="text-xs text-red-500">
                              {q.answerError}
                            </p>
                          )}
                        </>
                      ) : (
                        // === EXPRESIÓN MATEMÁTICA (LaTeX genérico) ===
                        <MathExpressionInput
                          value={q.answer}
                          onChange={(latex) =>
                            handleAnswerChange(q.templateId, latex)
                          }
                          placeholder={answerPlaceholder}
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

                            {correctForMode && (
                              <div className="text-xs">
                                <span className="opacity-70">Respuesta correcta:</span>
                                <div className="mt-1">
                                  {/[\\_^{}]/.test(correctForMode) ? (
                                    // Parece LaTeX → renderizamos con KaTeX
                                    <MathBlock text={correctForMode} />
                                  ) : (
                                    // Texto / número plano
                                    <span className="font-mono text-rose-900">
                                      {correctForMode}
                                    </span>
                                  )}
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
                        .map((chunk, idx2) => {
                          const processed = applyBoldHeadings(chunk);
                          return (
                            <p key={idx2} className="mb-2 text-sm text-blue-900">
                              <MathInline text={processed} />
                            </p>
                          );
                        })}
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
