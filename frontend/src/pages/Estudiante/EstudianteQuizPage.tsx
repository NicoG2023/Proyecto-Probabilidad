// src/pages/Estudiante/EstudianteQuizPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { EstudianteAPI as API } from "../../api/estudianteApi";
import type {
  IntentoVistaDTO,
  ResultadoEnvioDTO,
  RetroalimentacionDTO,
  LoteRespuestasDTO,
} from "../../api/estudianteApi";
import { useAuthStrict } from "../../auth/AuthContext";

// 🚩 KaTeX (estilos globales de render LaTeX)
import "katex/dist/katex.min.css";
import { MathInline, MathBlock } from "../../utils/MathText";

// Tipos locales para manejar selección heterogénea (MCQ + abiertas)
type SeleccionItem = {
  opcionMarcada?: string;   // MCQ
  valorNumero?: number;     // OPEN_NUM
  valorTexto?: string;      // OPEN_TEXT
};
type SeleccionState = Record<number, SeleccionItem>;

// Si ya expones tipo desde el backend, úsalo; si no, lo inferimos
type TipoPregunta = "MCQ" | "OPEN_NUM" | "OPEN_TEXT";

export default function EstudianteQuizPage() {
  const { ready, authenticated } = useAuthStrict();
  const { intentoId } = useParams<{ intentoId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<IntentoVistaDTO | null>(null);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvioDTO | null>(null);

  // Selección heterogénea
  const [seleccion, setSeleccion] = useState<SeleccionState>({});

  // Retroalimentación del backend (después de enviar o si ya estaba presentado)
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

        // Si ya estaba presentado, baja retro y pre-puebla selección
        if (data.estado === "PRESENTADO") {
          const retroData = await API.retroalimentacion(Number(intentoId));
          if (!mounted) return;
          setRetro(retroData);

          const sel: SeleccionState = {};
          retroData.forEach((r) => {
            if (r.opcionMarcada != null) {
              sel[r.instanciaId] = { opcionMarcada: r.opcionMarcada };
            } else if (r.numeroIngresado != null) {
              sel[r.instanciaId] = { valorNumero: r.numeroIngresado };
            } else if (r.valorIngresado != null) {
              sel[r.instanciaId] = { valorTexto: r.valorIngresado };
            }
          });
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

  // Índice de feedback por instanciaId
  const retroIndex = useMemo(() => {
    const m = new Map<number, RetroalimentacionDTO>();
    (retro ?? []).forEach((r) => m.set(r.instanciaId, r));
    return m;
  }, [retro]);

  // Enriquecer preguntas con opciones ordenadas, tipo y feedback
  const preguntas = useMemo(() => {
    const ps = vista?.preguntas ?? [];
    return ps.map((p) => {
      const entries = Object.entries(p.opciones ?? {});
      entries.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

      // Usa el tipo del backend si lo manda; si no, infiere por presencia de opciones
      const tipo: TipoPregunta =
        p.tipo ?? (entries.length > 0 ? "MCQ" : "OPEN_TEXT");

      const fb = retroIndex.get(p.instanciaId) || null;
      const feedback = fb
        ? {
            tipo,
            opcionMarcada: fb.opcionMarcada ?? undefined,
            esCorrecta: fb.esCorrecta,
            opcionCorrecta: fb.opcionCorrecta ?? null, // puede ser null en abiertas
            valorIngresado: fb.valorIngresado ?? null,
            numeroIngresado: fb.numeroIngresado ?? null,
            valorEsperado: fb.valorEsperado ?? null,   // <- mostrado como LaTeX si aplica
          }
        : undefined;

      return {
        ...p,
        opcionesOrdenadas: entries as [string, string][],
        tipo,
        feedback,
      };
    });
  }, [vista, retroIndex]);

  // Guardar (convierte la selección heterogénea al payload de lote)
  const handleGuardar = async () => {
    if (!vista) return;
    try {
      setSaving(true);
      const payload: LoteRespuestasDTO = {
        respuestas: Object.entries(seleccion).map(([instanciaIdStr, item]) => {
          const instanciaId = Number(instanciaIdStr);
          return {
            instanciaId,
            ...(item.opcionMarcada ? { opcionMarcada: item.opcionMarcada } : {}),
            ...(item.valorNumero !== undefined ? { valorNumero: item.valorNumero } : {}),
            ...(item.valorTexto !== undefined && item.valorTexto !== "" ? { valorTexto: item.valorTexto } : {}),
          };
        }),
      };
      payload.respuestas = payload.respuestas.filter(
        (it) =>
          !!it.opcionMarcada ||
          it.valorNumero !== undefined ||
          (it.valorTexto && it.valorTexto.trim() !== "")
      );
      await API.guardarRespuestas(vista.intentoId, payload);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "No se pudieron guardar las respuestas.");
    } finally {
      setSaving(false);
    }
  };

  // Enviar (guarda + califica + baja retro)
  const handleEnviar = async () => {
    if (!vista) return;

    const vacia =
      Object.values(seleccion).length === 0 ||
      Object.values(seleccion).every(
        (it) =>
          !it.opcionMarcada &&
          it.valorNumero === undefined &&
          !it.valorTexto
      );

    if (vacia) {
      const ok = confirm("Aún no has marcado respuestas. ¿Deseas enviar de todas formas?");
      if (!ok) return;
    }

    try {
      setSubmitting(true);

      // Guarda lo marcado
      const payload: LoteRespuestasDTO = {
        respuestas: Object.entries(seleccion).map(([instanciaIdStr, item]) => {
          const instanciaId = Number(instanciaIdStr);
          return {
            instanciaId,
            ...(item.opcionMarcada ? { opcionMarcada: item.opcionMarcada } : {}),
            ...(item.valorNumero !== undefined ? { valorNumero: item.valorNumero } : {}),
            ...(item.valorTexto !== undefined && item.valorTexto !== "" ? { valorTexto: item.valorTexto } : {}),
          };
        }),
      };
      await API.guardarRespuestas(vista.intentoId, payload);

      // Enviar
      const resumen = await API.enviarIntento(vista.intentoId);
      setResultado(resumen);
      setVista((v) => (v ? { ...v, estado: "PRESENTADO" } : v));

      // Retro
      const retroData = await API.retroalimentacion(vista.intentoId);
      setRetro(retroData);

      // Pre-popular selección con lo que quedó en servidor
      const sel: SeleccionState = {};
      retroData.forEach((r) => {
        if (r.opcionMarcada != null) sel[r.instanciaId] = { opcionMarcada: r.opcionMarcada };
        else if (r.numeroIngresado != null) sel[r.instanciaId] = { valorNumero: r.numeroIngresado };
        else if (r.valorIngresado != null) sel[r.instanciaId] = { valorTexto: r.valorIngresado };
      });
      setSeleccion(sel);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "No se pudo enviar el intento.");
    } finally {
      setSubmitting(false);
    }
  };

  const notaNum = resultado?.nota ?? null;
  const aprobado = notaNum != null ? notaNum >= 75 : null;

  return (
    // <section className="min-h-screen bg-gray-950 text-gray-100">
    //   <div className="mx-auto max-w-5xl px-4 py-8">
    //     <header className="mb-6 flex items-center justify-between">
    //       <div>
    //         <h1 className="text-xl font-semibold">Quiz</h1>
    //         <p className="text-sm text-gray-400">
    //           Intento #{intentoId} {vista?.quizId ? `· Quiz ${vista.quizId}` : ""} {vista?.estado ? `· ${vista.estado}` : ""}
    //         </p>
    //       </div>
    //       <Link
    //         to="/"
    //         className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
    //       >
    //         ← Volver al panel
    //       </Link>
    //     </header>

    //     {resultado && (
    //       <div
    //         className={`mb-6 rounded-xl border p-4 text-sm ${
    //           aprobado
    //             ? "border-emerald-700/40 bg-emerald-700/15 text-emerald-200"
    //             : "border-rose-700/40 bg-rose-700/15 text-rose-200"
    //         }`}
    //       >
    //         <div>
    //           Intento #{resultado.intentoId} <b className="mx-1">calificado</b>.{" "}
    //           Nota: <b>{resultado.nota?.toFixed(2) ?? "—"}%</b> · Correctas {resultado.correctas}/{resultado.totalPreguntas}.
    //         </div>
    //       </div>
    //     )}

    //     {loading && <Loader />}

    //     {!loading && error && (
    //       <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
    //         {error}
    //       </div>
    //     )}

    //     {!loading && !error && vista && (
    //       <div className="space-y-6">
    //         {preguntas.length === 0 ? (
    //           <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-400">
    //             Este intento aún no tiene preguntas.
    //           </div>
    //         ) : (
    //           preguntas.map((p, idx) => {
    //             const sel = seleccion[p.instanciaId] ?? {};
    //             return (
    //               <QuestionCard
    //                 key={p.instanciaId}
    //                 index={idx + 1}
    //                 enunciado={p.enunciado}
    //                 opciones={p.opcionesOrdenadas}
    //                 tipo={p.tipo as TipoPregunta}
    //                 name={`q_${p.instanciaId}`}
    //                 value={sel.opcionMarcada ?? ""}
    //                 openValueText={sel.valorTexto ?? ""}
    //                 openValueNumber={sel.valorNumero}
    //                 onChangeRadio={(val) =>
    //                   setSeleccion((s) => ({
    //                     ...s,
    //                     [p.instanciaId]: { ...s[p.instanciaId], opcionMarcada: val, valorTexto: undefined, valorNumero: undefined },
    //                   }))
    //                 }
    //                 onChangeOpenText={(val) =>
    //                   setSeleccion((s) => ({
    //                     ...s,
    //                     [p.instanciaId]: { ...s[p.instanciaId], valorTexto: val, opcionMarcada: undefined, valorNumero: undefined },
    //                   }))
    //                 }
    //                 onChangeOpenNumber={(val) =>
    //                   setSeleccion((s) => ({
    //                     ...s,
    //                     [p.instanciaId]: { ...s[p.instanciaId], valorNumero: val, opcionMarcada: undefined, valorTexto: undefined },
    //                   }))
    //                 }
    //                 disabled={yaPresentado}
    //                 feedback={p.feedback}
    //               />
    //             );
    //           })
    //         )}

    //         <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 p-3 backdrop-blur">
    //           <div className="text-xs text-gray-400">
    //             Preguntas: {preguntas.length}
    //             {resultado && (
    //               <span
    //                 className={`ml-3 rounded px-2 py-0.5 ${
    //                   aprobado ? "bg-emerald-600/20 text-emerald-300" : "bg-rose-600/20 text-rose-300"
    //                 }`}
    //               >
    //                 Nota: {resultado.nota?.toFixed(2) ?? "—"}% · Correctas {resultado.correctas}/{resultado.totalPreguntas}
    //               </span>
    //             )}
    //             {yaPresentado && !resultado && (
    //               <span className="ml-3 rounded bg-sky-600/20 px-2 py-0.5 text-sky-300">Intento enviado</span>
    //             )}
    //           </div>

    //           <div className="flex items-center gap-2">
    //             <button
    //               type="button"
    //               className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
    //               onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    //             >
    //               Subir
    //             </button>

    //             <button
    //               type="button"
    //               onClick={handleGuardar}
    //               disabled={saving || submitting || yaPresentado}
    //               className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-60"
    //               title={yaPresentado ? "El intento ya fue enviado" : "Guardar respuestas"}
    //             >
    //               {saving ? "Guardando…" : "Guardar"}
    //             </button>

    //             <button
    //               type="button"
    //               onClick={handleEnviar}
    //               disabled={submitting || yaPresentado}
    //               className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-60"
    //               title={yaPresentado ? "El intento ya fue enviado" : "Enviar y calificar"}
    //             >
    //               {submitting ? "Enviando…" : "Enviar"}
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     )}
    //   </div>
    // </section>
    <section className="min-h-screen bg-white text-black">
  <div className="mx-auto max-w-5xl px-4 py-8">

    {/* ENCABEZADO */}
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Quiz</h1>
        <p className="text-sm text-gray-600">
          Intento #{intentoId} {vista?.quizId ? `· Quiz ${vista.quizId}` : ""}{" "}
          {vista?.estado ? `· ${vista.estado}` : ""}
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-black hover:bg-gray-100"
      >
        ← Volver al panel
      </Link>
    </header>

    {/* RESULTADO */}
    {resultado && (
      <div
        className={`mb-6 rounded-xl border p-4 text-sm ${
          aprobado
            ? "border-emerald-400 bg-emerald-100 text-emerald-800"
            : "border-rose-400 bg-rose-100 text-rose-800"
        }`}
      >
        <div>
          Intento #{resultado.intentoId}{" "}
          <b className="mx-1">calificado</b>. Nota:{" "}
          <b>{resultado.nota?.toFixed(2) ?? "—"}%</b> · Correctas{" "}
          {resultado.correctas}/{resultado.totalPreguntas}.
        </div>
      </div>
    )}

    {/* LOADING */}
    {loading && <Loader />}

    {/* ERROR */}
    {!loading && error && (
      <div className="rounded-lg border border-amber-300 bg-amber-100 p-4 text-amber-800">
        {error}
      </div>
    )}

    {/* CONTENIDO */}
    {!loading && !error && vista && (
      <div className="space-y-6">

        {/* SIN PREGUNTAS */}
        {preguntas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-100 p-6 text-sm text-gray-600">
            Este intento aún no tiene preguntas.
          </div>
        ) : (
          preguntas.map((p, idx) => {
            const sel = seleccion[p.instanciaId] ?? {};
            return (
              <QuestionCard
                key={p.instanciaId}
                index={idx + 1}
                enunciado={p.enunciado}
                opciones={p.opcionesOrdenadas}
                tipo={p.tipo}
                name={`q_${p.instanciaId}`}
                value={sel.opcionMarcada ?? ""}
                openValueText={sel.valorTexto ?? ""}
                openValueNumber={sel.valorNumero}
                onChangeRadio={(val) =>
                  setSeleccion((s) => ({
                    ...s,
                    [p.instanciaId]: {
                      ...s[p.instanciaId],
                      opcionMarcada: val,
                      valorTexto: undefined,
                      valorNumero: undefined,
                    },
                  }))
                }
                onChangeOpenText={(val) =>
                  setSeleccion((s) => ({
                    ...s,
                    [p.instanciaId]: {
                      ...s[p.instanciaId],
                      valorTexto: val,
                      opcionMarcada: undefined,
                      valorNumero: undefined,
                    },
                  }))
                }
                onChangeOpenNumber={(val) =>
                      setSeleccion((s) => ({
                        ...s,
                        [p.instanciaId]: { ...s[p.instanciaId], valorNumero: val, opcionMarcada: undefined, valorTexto: undefined },
                      }))
                    }
                disabled={yaPresentado}
                feedback={p.feedback}
              />
            );
          })
        )}

        {/* BARRA INFERIOR */}
        <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl border border-gray-300 bg-gray-100 p-3 backdrop-blur">
          <div className="text-xs text-gray-600">
            Preguntas: {preguntas.length}
            {resultado && (
              <span
                className={`ml-3 rounded px-2 py-0.5 ${
                  aprobado
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-rose-200 text-rose-800"
                }`}
              >
                Nota: {resultado.nota?.toFixed(2) ?? "—"}% · Correctas{" "}
                {resultado.correctas}/{resultado.totalPreguntas}
              </span>
            )}
            {yaPresentado && !resultado && (
              <span className="ml-3 rounded bg-blue-200 px-2 py-0.5 text-blue-800">
                Intento enviado
              </span>
            )}
          </div>

          {/* BOTONES */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-black hover:bg-gray-200"
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
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-black hover:bg-gray-200 disabled:opacity-60"
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
  tipo: "MCQ" | "OPEN_NUM" | "OPEN_TEXT";
  name: string;

  // Selección
  value: string;                 // para MCQ
  openValueText?: string;        // para OPEN_TEXT
  openValueNumber?: number;      // para OPEN_NUM

  // Handlers
  onChangeRadio: (val: string) => void;
  onChangeOpenText: (val: string) => void;
  onChangeOpenNumber: (val: number | undefined) => void;

  disabled?: boolean;

  feedback?: {
    tipo: "MCQ" | "OPEN_NUM" | "OPEN_TEXT";
    opcionMarcada?: string;
    esCorrecta: boolean;
    opcionCorrecta: string | null;     // <- permitir null
    valorIngresado?: string | null;    // OPEN_TEXT
    numeroIngresado?: number | null;   // OPEN_NUM
    valorEsperado?: string | null;     // texto o LaTeX
  };
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
      <div className="mb-3 text-sm font-medium text-gray-300">
        <span className="mr-2 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
          {props.index}
        </span>
        {/* Render enunciado: si trae LaTeX entre $...$ o $$...$$ se muestra como ecuación */}
        <p className="inline">
          <MathInline text={props.enunciado ?? ""} />
        </p>
      </div>

      {/* Render según tipo */}
      {props.tipo === "MCQ" ? (
        <div className="space-y-2">
          {props.opciones.map(([key, label]) => {
            const id = `${props.name}_${key}`;

            let optionClasses = "rounded-lg border border-gray-800 bg-gray-900/50";
            if (props.feedback) {
              const marcada = props.feedback.opcionMarcada;
              const correcta = props.feedback.opcionCorrecta ?? undefined;

              if (key === correcta) optionClasses = "rounded-lg border border-emerald-600 bg-emerald-700/20";
              if (marcada && key === marcada && !props.feedback.esCorrecta)
                optionClasses = "rounded-lg border border-rose-600 bg-rose-700/20";
            }

            return (
              <label
                key={key}
                htmlFor={id}
                className={`flex items-center gap-3 px-3 py-2 ${
                  props.disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-gray-800/60"
                } ${optionClasses}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={props.name}
                  value={key}
                  checked={props.value === key}
                  onChange={() => !props.disabled && props.onChangeRadio(key)}
                  className="h-4 w-4 accent-blue-500"
                  disabled={props.disabled}
                />
                <span className="text-sm text-gray-100">
                  <span className="mr-2 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">
                    {key}
                  </span>
                  <MathInline text={label} />
                </span>
              </label>
            );
          })}
        </div>
      ) : props.tipo === "OPEN_NUM" ? (
        <div className="space-y-2">
          <input
            type="number"
            className="w-full rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-600"
            value={props.openValueNumber ?? ""}
            onChange={(e) => props.onChangeOpenNumber(e.target.value === "" ? undefined : Number(e.target.value))}
            disabled={props.disabled}
            placeholder="Escribe un número..."
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs text-gray-400">
            Puedes escribir tu respuesta en LaTeX, por ejemplo:{" "}
            <code className="font-mono text-[11px] text-gray-300">
              {"f_Y(y)=\\frac{2^{1/3}}{3y^{1/3}},\\ 0<y<2"}
            </code>
          </label>

          <textarea
            className="w-full min-h-[80px] rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-blue-600"
            value={props.openValueText ?? ""}
            onChange={(e) => props.onChangeOpenText(e.target.value)}
            disabled={props.disabled}
            placeholder="Escribe aquí tu expresión (se acepta LaTeX)..."
          />

          {/* Preview en tiempo real (usa KaTeX si parece matemática) */}
          {props.openValueText && (
            <div className="mt-1 text-xs text-gray-400">
              Vista previa:
              <MathBlock text={props.openValueText} />
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {props.feedback && (
        <div className="mt-3 text-xs">
          {props.feedback.tipo === "MCQ" ? (
            props.feedback.esCorrecta ? (
              <span className="rounded bg-emerald-700/20 px-2 py-0.5 text-emerald-300">¡Correcto!</span>
            ) : (
              <span className="rounded bg-rose-700/20 px-2 py-0.5 text-rose-300">
                Incorrecto · Correcta: <b>{props.feedback.opcionCorrecta ?? "—"}</b>
              </span>
            )
          ) : props.feedback.esCorrecta ? (
            <span className="rounded bg-emerald-700/20 px-2 py-0.5 text-emerald-300">¡Respuesta correcta!</span>
          ) : (
            <div className="rounded bg-rose-700/20 px-2 py-1 text-rose-200">
              <div>Incorrecta</div>
              {props.feedback.valorEsperado && (
                <div className="mt-1">
                  <span className="mr-1 opacity-80">Esperada:</span>
                  {/* Si viene en LaTeX ($...$ o $$...$$) se muestra como ecuación; si no, como texto/valor */}
                  <MathBlock text={props.feedback.valorEsperado} />
                </div>
              )}
            </div>
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
