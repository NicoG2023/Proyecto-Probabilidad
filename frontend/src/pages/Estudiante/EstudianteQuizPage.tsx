// src/pages/Estudiante/EstudianteQuizPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { EstudianteAPI as API } from "../../api/estudianteApi";
import type { IntentoVistaDTO } from "../../api/estudianteApi";
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

  // Estado local para selección (no se guarda aún; solo visual)
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});

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
        // precarga selección vacía
        setSeleccion({});
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message ?? "No se pudo cargar el intento.");
        setVista(null);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ready, authenticated, intentoId]);

  const preguntas = useMemo(() => {
    const ps = vista?.preguntas ?? [];
    // Ordena opciones por clave (A, B, C, D…) para que sea estable
    return ps.map(p => {
      const entries = Object.entries(p.opciones ?? {});
      entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
      return { ...p, opcionesOrdenadas: entries };
    });
  }, [vista]);

  return (
    <section className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Quiz</h1>
            <p className="text-sm text-gray-400">
              Intento #{intentoId} {vista?.quizId ? `· Quiz ${vista.quizId}` : ""} {vista?.estado ? `· ${vista.estado}` : ""}
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
          >
            ← Volver al panel
          </Link>
        </header>

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
                />
              ))
            )}

            {/* Barra inferior (por ahora sólo UI, sin acciones) */}
            <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 p-3 backdrop-blur">
              <div className="text-xs text-gray-400">
                Preguntas: {preguntas.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  Subir
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-lg bg-blue-600/60 px-3 py-1.5 text-sm text-white opacity-60"
                  title="Próximamente"
                >
                  Enviar (pronto)
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
}) {
  // Si tienes enunciado en Markdown, sustituye el <p> por ReactMarkdown (ver imports arriba)
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
          return (
            <label
              key={key}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 hover:bg-gray-800/60"
            >
              <input
                id={id}
                type="radio"
                name={props.name}
                value={key}
                checked={props.value === key}
                onChange={() => props.onChange(key)}
                className="h-4 w-4 accent-blue-500"
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
