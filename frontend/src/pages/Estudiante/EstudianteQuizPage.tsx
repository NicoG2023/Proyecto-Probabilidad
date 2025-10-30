// src/pages/Estudiante/EstudianteQuizPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { EstudianteAPI as API } from "../../api/estudianteApi";
import type {
  IntentoVistaDTO,
  ResultadoEnvioDTO,
  RetroalimentacionDTO,
} from "../../api/estudianteApi";
import { useAuthStrict } from "../../auth/AuthContext";
// Si usas markdown en enunciados, descomenta estas 2 líneas y ejecuta: npm i react-markdown
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

export default function EstudianteQuizPage() {
  const { ready, authenticated } = useAuthStrict();
  const { intentoId } = useParams<{ intentoId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<IntentoVistaDTO | null>(null);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvioDTO | null>(null);

  // Respuestas seleccionadas en UI
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});

  // Retroalimentación del backend (solo tras enviar o si ya estaba presentado)
  const [retro, setRetro] = useState<RetroalimentacionDTO[] | null>(null);

  const yaPresentado = useMemo(() => vista?.estado === "PRESENTADO", [vista]);

  useEffect(() => {
    if (!ready || !authenticated || !intentoId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await API.verIntento(Number(intentoId));
        if (!mounted) return;

        setVista(data);
        setSeleccion({}); // limpia selección inicial

        // Si ya estaba presentado, trae retro y pre-marca lo que el alumno eligió
        if (data.estado === "PRESENTADO") {
          const retroData = await API.retroalimentacion(Number(intentoId));
          if (!mounted) return;
          setRetro(retroData);

          const sel = Object.fromEntries(
            retroData
              .filter((r) => r.opcionMarcada != null)
              .map((r) => [r.instanciaId, r.opcionMarcada as string])
          );
          setSeleccion(sel);
        }
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message ?? "No se pudo cargar el intento.");
        setVista(null);
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated, intentoId]);

  // Índice de feedback por instanciaId para fusionar con las preguntas
  const retroIndex = useMemo(() => {
    const m = new Map<number, RetroalimentacionDTO>();
    (retro ?? []).forEach((r) => m.set(r.instanciaId, r));
    return m;
  }, [retro]);

  // Preguntas con opciones ordenadas y feedback (si existe)
  const preguntas = useMemo(() => {
    const ps = vista?.preguntas ?? [];
    return ps.map((p) => {
      const entries = Object.entries(p.opciones ?? {});
      entries.sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true })
      );

      const fb = retroIndex.get(p.instanciaId) || null;
      const feedback = fb
        ? {
            opcionMarcada: fb.opcionMarcada ?? undefined,
            esCorrecta: fb.esCorrecta,
            opcionCorrecta: fb.opcionCorrecta,
          }
        : undefined;

      return { ...p, opcionesOrdenadas: entries as [string, string][], feedback };
    });
  }, [vista, retroIndex]);

  const handleGuardar = async () => {
    if (!vista) return;
    try {
      setSaving(true);
      await API.guardarRespuestas(vista.intentoId, seleccion);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "No se pudieron guardar las respuestas.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnviar = async () => {
    if (!vista) return;

    // Protección simple: evitar envío sin seleccionar nada
    if (Object.keys(seleccion).length === 0) {
      const ok = confirm(
        "Aún no has marcado respuestas. ¿Deseas enviar de todas formas?"
      );
      if (!ok) return;
    }

    try {
      setSubmitting(true);

      // Guarda lo marcado y luego envía para calificar
      await API.guardarRespuestas(vista.intentoId, seleccion);
      const resumen = await API.enviarIntento(vista.intentoId);
      setResultado(resumen);

      // Bloquea edición en UI
      setVista((v) => (v ? { ...v, estado: "PRESENTADO" } : v));

      // Trae retroalimentación y pre-marca lo que haya quedado en servidor
      const retroData = await API.retroalimentacion(vista.intentoId);
      setRetro(retroData);
      const sel = Object.fromEntries(
        retroData
          .filter((r) => r.opcionMarcada != null)
          .map((r) => [r.instanciaId, r.opcionMarcada as string])
      );
      setSeleccion(sel);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "No se pudo enviar el intento.");
    } finally {
      setSubmitting(false);
    }
  };

  // Nota para colorear banners/píldoras (si hay resultado)
  const notaNum = resultado?.nota ?? null;
  const aprobado = notaNum != null ? notaNum >= 75 : null;

  return (
    <section className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Quiz</h1>
            <p className="text-sm text-gray-400">
              Intento #{intentoId}{" "}
              {vista?.quizId ? `· Quiz ${vista.quizId}` : ""}{" "}
              {vista?.estado ? `· ${vista.estado}` : ""}
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
          >
            ← Volver al panel
          </Link>
        </header>

        {resultado && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              aprobado
                ? "border-emerald-700/40 bg-emerald-700/15 text-emerald-200"
                : "border-rose-700/40 bg-rose-700/15 text-rose-200"
            }`}
          >
            <div>
              Intento #{resultado.intentoId} <b className="mx-1">calificado</b>.
              Nota: <b>{resultado.nota?.toFixed(2) ?? "—"}%</b> · Correctas{" "}
              {resultado.correctas}/{resultado.totalPreguntas}.
            </div>
          </div>
        )}

        {loading && <Loader />}

        {!loading && error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
            {error}
          </div>
        )}

        {!loading && !error && vista && (
          <div className="space-y-6">
            {preguntas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-400">
                Este intento aún no tiene preguntas.
              </div>
            ) : (
              preguntas.map((p, idx) => (
                <QuestionCard
                  key={p.instanciaId}
                  index={idx + 1}
                  enunciado={p.enunciado}
                  opciones={p.opcionesOrdenadas}
                  name={`q_${p.instanciaId}`}
                  value={seleccion[p.instanciaId] ?? ""}
                  onChange={(val) =>
                    setSeleccion((s) => ({ ...s, [p.instanciaId]: val }))
                  }
                  disabled={yaPresentado}
                  feedback={p.feedback}
                />
              ))
            )}

            {/* Barra inferior con acciones y resumen */}
            <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 p-3 backdrop-blur">
              <div className="text-xs text-gray-400">
                Preguntas: {preguntas.length}
                {resultado && (
                  <span
                    className={`ml-3 rounded px-2 py-0.5 ${
                      aprobado
                        ? "bg-emerald-600/20 text-emerald-300"
                        : "bg-rose-600/20 text-rose-300"
                    }`}
                  >
                    Nota: {resultado.nota?.toFixed(2) ?? "—"}% · Correctas{" "}
                    {resultado.correctas}/{resultado.totalPreguntas}
                  </span>
                )}
                {yaPresentado && !resultado && (
                  <span className="ml-3 rounded bg-sky-600/20 px-2 py-0.5 text-sky-300">
                    Intento enviado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Subir
                </button>

                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={saving || submitting || yaPresentado}
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-60"
                  title={
                    yaPresentado
                      ? "El intento ya fue enviado"
                      : "Guardar respuestas"
                  }
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={handleEnviar}
                  disabled={submitting || yaPresentado}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
                  title={
                    yaPresentado
                      ? "El intento ya fue enviado"
                      : "Enviar y calificar"
                  }
                >
                  {submitting ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ========== UI ========== */

function QuestionCard(props: {
  index: number;
  enunciado: string;
  opciones: [string, string][];
  name: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  feedback?: {
    opcionMarcada?: string;
    esCorrecta: boolean;
    opcionCorrecta: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
      <div className="mb-3 text-sm font-medium text-gray-300">
        <span className="mr-2 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
          {props.index}
        </span>
        {/* <ReactMarkdown remarkPlugins={[remarkGfm]} className="inline">
          {props.enunciado ?? ""}
        </ReactMarkdown> */}
        <p className="inline">{props.enunciado ?? ""}</p>
      </div>

      <div className="space-y-2">
        {props.opciones.map(([key, label]) => {
          const id = `${props.name}_${key}`;

          // Colores según feedback:
          let optionClasses =
            "rounded-lg border border-gray-800 bg-gray-900/50";
          if (props.feedback) {
            const marcada = props.feedback.opcionMarcada;
            const correcta = props.feedback.opcionCorrecta;

            if (key === correcta) {
              optionClasses = "rounded-lg border border-emerald-600 bg-emerald-700/20";
            }
            if (marcada && key === marcada && !props.feedback.esCorrecta) {
              optionClasses = "rounded-lg border border-rose-600 bg-rose-700/20";
            }
          }

          return (
            <label
              key={key}
              htmlFor={id}
              className={`flex items-center gap-3 px-3 py-2 ${
                props.disabled
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:bg-gray-800/60"
              } ${optionClasses}`}
            >
              <input
                id={id}
                type="radio"
                name={props.name}
                value={key}
                checked={props.value === key}
                onChange={() => !props.disabled && props.onChange(key)}
                className="h-4 w-4 accent-blue-500"
                disabled={props.disabled}
              />
              <span className="text-sm text-gray-100">
                <span className="mr-2 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">
                  {key}
                </span>
                {label}
              </span>
            </label>
          );
        })}
      </div>

      {props.feedback && (
        <div className="mt-3 text-xs">
          {props.feedback.esCorrecta ? (
            <span className="rounded bg-emerald-700/20 px-2 py-0.5 text-emerald-300">
              ¡Correcto!
            </span>
          ) : (
            <span className="rounded bg-rose-700/20 px-2 py-0.5 text-rose-300">
              Incorrecto · Correcta: <b>{props.feedback.opcionCorrecta}</b>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800/40" />
      ))}
    </div>
  );
}
