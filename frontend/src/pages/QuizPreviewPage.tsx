// src/pages/Profesor/QuizPreviewPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStrict } from "../auth/AuthContext";

import "katex/dist/katex.min.css";
import { MathInline, MathBlock } from "../utils/MathText";

import {
  PreviewAPI,
  type PreviewQuizDto,
  type PreviewPreguntaDto,
} from "../api/previewApi";

type TipoPregunta = "MCQ" | "OPEN_NUM" | "OPEN_TEXT";

type PreguntaEnriquecida = PreviewPreguntaDto & {
  opcionesOrdenadas: [string, string][];
  tipoNormalizado: TipoPregunta;
};

export default function QuizPreviewPage() {
  const { ready, authenticated } = useAuthStrict();
  const { intentoId } = useParams<{ intentoId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewQuizDto | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !intentoId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await PreviewAPI.verIntento(Number(intentoId));
        if (!mounted) return;
        setPreview(data);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError(e?.message ?? "No se pudo cargar la vista previa del intento.");
        setPreview(null);
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated, intentoId]);

  const preguntas: PreguntaEnriquecida[] = useMemo(() => {
    if (!preview) return [];
    return (preview.preguntas ?? []).map((p) => {
      const entries = Object.entries(p.opciones ?? {});
      entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

      const tipo: TipoPregunta =
        (p.tipo as TipoPregunta) ??
        (entries.length > 0 ? "MCQ" : "OPEN_TEXT");

      return {
        ...p,
        opcionesOrdenadas: entries as [string, string][],
        tipoNormalizado: tipo,
      };
    });
  }, [preview]);

  const notaNum = useMemo(() => {
    if (!preview || preview.nota == null) return null;
    const n = Number(preview.nota);
    if (!Number.isFinite(n)) return null;
    return n;
  }, [preview]);

  return (
    <section className="min-h-screen bg-white text-black">
  <div className="mx-auto max-w-5xl px-4 py-8">
    {/* Encabezado */}
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-black">
          Vista del intento
        </h1>
        <p className="text-sm text-gray-600">
          Intento #{intentoId}
          {preview?.quizTitulo ? ` · ${preview.quizTitulo}` : ""}
          {preview?.estado ? ` · ${preview.estado}` : ""}
        </p>
        {preview && (
          <p className="mt-1 text-xs text-gray-500">
            Alumno:{" "}
            <span className="text-black">
              {preview.estudianteUsername ?? "—"}
            </span>
            {preview.estudianteEmail && (
              <>
                {" · "}
                <span className="text-gray-700">
                  {preview.estudianteEmail}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {notaNum != null && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 border border-blue-300">
            Nota: {notaNum.toFixed(2)}%
          </span>
        )}
        <Link
          to="/profesor"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-black hover:bg-gray-100"
        >
          ← Volver al panel
        </Link>
      </div>
    </header>

    {/* Mensajes de estado */}
    {loading && <Loader />}

    {!loading && error && (
      <div className="rounded-lg border border-yellow-400 bg-yellow-100 p-4 text-yellow-800 text-sm">
        {error}
      </div>
    )}

    {!loading && !error && preview && (
      <div className="space-y-6">
        {preguntas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            Este intento no tiene preguntas registradas.
          </div>
        ) : (
          preguntas.map((p, idx) => (
            <PreguntaPreviewCard
              key={p.instanciaId}
              index={idx + 1}
              pregunta={p}
            />
          ))
        )}
      </div>
    )}
  </div>
</section>

  );
}

/* ========== Cards ========== */
function PreguntaPreviewCard({
  index,
  pregunta,
}: {
  index: number;
  pregunta: PreguntaEnriquecida;
}) {
  const {
    enunciado,
    opcionesOrdenadas,
    tipoNormalizado,
    opcionMarcada,
    opcionCorrecta,
    valorIngresado,
    valorEsperado,
    numeroIngresado,
    numeroEsperado,
    esCorrecta,
  } = pregunta;

  return (
    <article className="rounded-2xl border border-gray-300 bg-white p-5">
      {/* Enunciado */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">
          <span className="mr-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
            {index}
          </span>
          <span className="align-middle">
            <MathInline text={enunciado ?? ""} />
          </span>
        </div>

        <span
          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
            esCorrecta
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-rose-100 text-rose-700 border-rose-300"
          }`}
        >
          {esCorrecta ? "Correcta" : "Incorrecta"}
        </span>
      </div>

      {/* Cuerpo según tipo */}
      {tipoNormalizado === "MCQ" ? (
        <div className="space-y-2 mt-2">
          {opcionesOrdenadas.map(([key, label]) => {
            const isMarked = key === opcionMarcada;
            const isCorrectKey = key === opcionCorrecta;

            let base =
              "flex items-center gap-3 px-3 py-2 rounded-lg border text-sm";
            let colors =
              "border-gray-300 bg-gray-100 text-gray-900";

            if (isCorrectKey && isMarked) {
              colors =
                "border-emerald-400 bg-emerald-100 text-emerald-700";
            } else if (isCorrectKey && !isMarked) {
              colors =
                "border-emerald-300 bg-emerald-50 text-emerald-700";
            } else if (isMarked && !isCorrectKey) {
              colors =
                "border-rose-400 bg-rose-100 text-rose-700";
            }

            return (
              <div key={key} className={`${base} ${colors}`}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-700">
                  {key}
                </div>

                <div className="flex-1 text-gray-900">
                  <MathInline text={label} />
                </div>

                {isMarked && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700 border border-blue-200">
                    Marcada
                  </span>
                )}

                {isCorrectKey && (
                  <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 border border-emerald-200">
                    Correcta
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : tipoNormalizado === "OPEN_TEXT" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-gray-300 bg-white p-3 text-xs">
            <p className="mb-1 font-semibold text-gray-800">
              Respuesta del estudiante
            </p>
            {valorIngresado ? (
              <MathBlock text={valorIngresado} />
            ) : (
              <p className="text-gray-500 italic">Sin respuesta.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-300 bg-white p-3 text-xs">
            <p className="mb-1 font-semibold text-gray-800">
              Respuesta esperada
            </p>
            {valorEsperado ? (
              <MathBlock text={valorEsperado} />
            ) : (
              <p className="text-gray-500 italic">No definida.</p>
            )}
          </div>
        </div>
      ) : (
        /* OPEN_NUM */
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-gray-300 bg-white p-3 text-xs">
            <p className="mb-1 font-semibold text-gray-800">
              Valor ingresado
            </p>
            {numeroIngresado != null ? (
              <span className="font-mono text-sm text-gray-900">
                {numeroIngresado}
              </span>
            ) : (
              <p className="text-gray-500 italic">Sin respuesta.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-300 bg-white p-3 text-xs">
            <p className="mb-1 font-semibold text-gray-800">
              Valor esperado
            </p>
            {numeroEsperado != null ? (
              <span className="font-mono text-sm text-gray-900">
                {numeroEsperado}
              </span>
            ) : (
              <p className="text-gray-500 italic">No definido.</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}


/* ========== Loader ========== */

function Loader() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl bg-gray-800/40"
        />
      ))}
    </div>
  );
}
