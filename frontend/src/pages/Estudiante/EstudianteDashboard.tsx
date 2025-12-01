// src/pages/EstudianteDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { EstudianteAPI as API } from "../../api/estudianteApi";
import {
  PRACTICE_TEMPLATES,
  type PracticeCorte,
} from "../../constants/practiceTemplates";
import type {
  Corte,
  IntentoCreadoDTO,
  IntentoQuiz,
  EstadisticasYo,
} from "../../api/estudianteApi";
import { useAuthStrict } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function EstudianteDashboard() {
  const { ready, authenticated } = useAuthStrict();
  const navigate = useNavigate();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<EstadisticasYo | null>(null);
  const [loadingHist, setLoadingHist] = useState(true);
  const [historial, setHistorial] = useState<IntentoQuiz[]>([]);
  const [starting, setStarting] = useState<Corte | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar estadísticas
  useEffect(() => {
    if (!ready || !authenticated) return;
    let mounted = true;
    (async () => {
      try {
        const data = await API.estadisticas();
        if (mounted) setStats(data);
      } catch (e) {
        console.error(e);
        if (mounted) setStats(null);
      } finally {
        mounted && setLoadingStats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ready, authenticated]);

  // Cargar intentos
  useEffect(() => {
    if (!ready || !authenticated) return;
    let mounted = true;
    (async () => {
      try {
        const data = await API.ultimosIntentos(0, 8);
        if (mounted) setHistorial(data ?? []);
      } catch (e) {
        console.error(e);
        if (mounted) setHistorial([]);
      } finally {
        mounted && setLoadingHist(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ready, authenticated]);

  // Normalizar promedios
  const promedios = useMemo(() => {
    const base = stats?.promedioPorCorte ?? {};
    const C1 = getNumberOrNull(base["C1"]);
    const C2 = getNumberOrNull(base["C2"]);
    const C3 =
      getNumberOrNull(base["C3"]) ??
      average(
        [getNumberOrNull(base["C3A"]), getNumberOrNull(base["C3B"])].filter(
          (x): x is number => x != null
        )
      );
    return { C1, C2, C3 };
  }, [stats]);

  // Empezar quiz (modo examen)
  const handleStartQuiz = async (corte: Corte) => {
    try {
      setStarting(corte);
      setError(null);
      const dto: IntentoCreadoDTO = await API.crearIntento(corte);
      navigate(`/estudiante/quices/${dto.intentoId}`);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message ?? "No se pudo iniciar el intento. Intenta de nuevo."
      );
    } finally {
      setStarting(null);
    }
  };

  // Ir a práctica por corte (C1, C2, C3A, C3B)
  const handlePractice = (corte: PracticeCorte) => {
    const templates = PRACTICE_TEMPLATES[corte];
    if (!templates || templates.length === 0) {
      alert("Aún no hay preguntas de práctica configuradas para este corte.");
      return;
    }
    navigate(`/estudiante/practica/${corte}`);
  };

  return (
    <section className="min-h-screen bg-[#FFFFFF] text-[#1F2937]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Encabezado */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Panel del Estudiante
          </h1>

          <span className="rounded-full border border-[#E5E7EB] bg-[#DBEAFE] px-3 py-1 text-sm text-[#1F2937]">
            Quices · C1 · C2 · C3
          </span>
        </header>

        {/* Tarjetas para iniciar quices (modo examen) */}
        <div className="grid gap-6 md:grid-cols-3">
          <ActionCard
            title="Tomar Quiz - Corte 1"
            subtitle="Primer corte (C1)"
            accent="blue"
            loading={starting === "C1"}
            onClick={() => handleStartQuiz("C1")}
          />
          <ActionCard
            title="Tomar Quiz - Corte 2"
            subtitle="Segundo corte (C2)"
            accent="blue"
            loading={starting === "C2"}
            onClick={() => handleStartQuiz("C2")}
          />
          <ActionCard
            title="Tomar Quiz - Corte 3"
            subtitle="Tercer corte (C3)"
            accent="blue"
            loading={starting === "C3"}
            onClick={() => handleStartQuiz("C3")}
          />
        </div>

        {/* ================== NUEVA SECCIÓN: MODO PRÁCTICA ================== */}
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-medium text-[#1F2937]">
            Practicar por corte
          </h2>
          <p className="mb-4 text-sm text-[#6B7280]">
            En cada corte podrás practicar con todas las preguntas de ese
            contenido. Ajusta los parámetros, responde y revisa la explicación
            paso a paso.
          </p>

          <div className="grid gap-6 md:grid-cols-4">
            <PracticeCard
              corteLabel="Corte 1"
              title="Práctica C1"
              subtitle="Multinomial, intervalos, normal, etc."
              onClick={() => handlePractice("C1")}
            />
            <PracticeCard
              corteLabel="Corte 2"
              title="Práctica C2"
              subtitle="Binomial→normal, Exponencial, Weibull…"
              onClick={() => handlePractice("C2")}
            />
            <PracticeCard
              corteLabel="Corte 3A"
              title="Práctica C3A"
              subtitle="Normal tolerancias, hipergeométrica…"
              onClick={() => handlePractice("C3A")}
            />
            <PracticeCard
              corteLabel="Corte 3B"
              title="Práctica C3B"
              subtitle="Normal intervalo, transformaciones, etc."
              onClick={() => handlePractice("C3B")}
            />
          </div>
        </section>

        {/* Error global */}
        {error && (
          <div className="mt-6 rounded-lg border border-[#FBBF24] bg-[#FFFBEB] p-4 text-[#92400E] shadow-sm">
            {error}
          </div>
        )}

        {/* Estadísticas */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-[#1F2937]">
            Mis estadísticas
          </h2>

          <div className="grid gap-6 md:grid-cols-4">
            <KpiCard
              label="Intentos presentados"
              value={loadingStats ? "…" : stats?.intentos ?? 0}
            />
            <KpiCard
              label="Promedio global"
              value={
                loadingStats ? "…" : formatMaybeNumber(stats?.promedio, 2, "%")
              }
            />
            <KpiCard
              label="Promedio C1"
              value={
                loadingStats ? "…" : formatMaybeNumber(promedios.C1, 2, "%")
              }
            />
            <KpiCard
              label="Promedio C2"
              value={
                loadingStats ? "…" : formatMaybeNumber(promedios.C2, 2, "%")
              }
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-1">
            <KpiCard
              label="Promedio C3"
              value={
                loadingStats ? "…" : formatMaybeNumber(promedios.C3, 2, "%")
              }
            />
          </div>

          {/* Últimos intentos */}
          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 shadow-sm">
            <h3 className="mb-3 text-base font-medium text-[#1F2937]">
              Últimos intentos
            </h3>

            {loadingHist ? (
              <SkeletonTable />
            ) : historial.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full table-auto border-collapse text-sm bg-[#FFFFFF] rounded-lg overflow-hidden">
                <thead>
                  <tr className="text-left bg-[#85B8FC] text-[#1F2937]">
                    <th className="border-b border-[#E5E7EB] px-2 py-2">ID</th>
                    <th className="border-b border-[#E5E7EB] px-2 py-2">
                      Corte
                    </th>
                    <th className="border-b border-[#E5E7EB] px-2 py-2">
                      Nota
                    </th>
                    <th className="border-b border-[#E5E7EB] px-2 py-2">
                      Estado
                    </th>
                    <th className="border-b border-[#E5E7EB] px-2 py-2">
                      Fecha
                    </th>
                    <th className="border-b border-[#E5E7EB] px-2 py-2 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {historial.map((it) => (
                    <tr
                      key={it.id}
                      className="transition-colors hover:bg-[#F9FAFB]"
                    >
                      <td className="border-b border-[#E5E7EB] px-2 py-2">
                        {it.id}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-2 py-2">
                        {it?.quiz?.corte ?? "—"}
                      </td>
                      <td className="border-b border-[#E5E7EB] px-2 py-2">
                        {formatMaybeNumber(it?.score, 2, "%")}
                      </td>

                      <td className="border-b border-[#E5E7EB] px-2 py-2">
                        <StudentStatusPill status={it.status} />
                      </td>

                      <td className="border-b border-[#E5E7EB] px-2 py-2">
                        {it.submittedAt
                          ? new Date(it.submittedAt).toLocaleString()
                          : it.startedAt
                          ? new Date(it.startedAt).toLocaleString()
                          : "—"}
                      </td>

                      <td className="border-b border-[#E5E7EB] px-2 py-2 text-right">
                        {it.status && it.status !== "PRESENTADO" ? (
                          <button
                            onClick={() =>
                              navigate(`/estudiante/quices/${it.id}`)
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white transition hover:from-[#3B82F6] hover:to-[#60A5FA]"
                          >
                            {it.status === "EN_PROGRESO"
                              ? "Continuar"
                              : "Retomar"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#6B7280]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

/* ============ UI Components ============ */

function ActionCard(props: {
  title: string;
  subtitle?: string;
  accent: "blue" | "amber" | "slate";
  loading?: boolean;
  onClick: () => void;
}) {
  const accentClasses =
    props.accent === "blue"
      ? "from-[#60A5FA] to-[#3B82F6]"
      : props.accent === "amber"
      ? "from-[#60A5FA] to-[#3B82F6]"
      : "from-[#60A5FA] to-[#3B82F6]";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#DBEAFE] p-5 shadow-sm">
      <div
        className={`absolute right-[-30px] top-[-30px] h-28 w-28 rounded-full bg-gradient-to-br ${accentClasses} opacity-40 blur-xl`}
      />

      <h3 className="mb-1 text-base font-semibold text-[#1F2937]">
        {props.title}
      </h3>

      {props.subtitle && (
        <p className="mb-4 text-sm text-[#6B7280]">{props.subtitle}</p>
      )}

      <button
        onClick={props.onClick}
        disabled={props.loading}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:from-[#3B82F6] hover:to-[#60A5FA] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {props.loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Iniciando…
          </>
        ) : (
          <>Comenzar</>
        )}
      </button>
    </div>
  );
}

/**
 * Card para modo práctica: un solo botón por corte.
 */
function PracticeCard(props: {
  corteLabel: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 shadow-sm">
      <div className="mb-2 inline-flex items-center rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] font-medium text-[#1F2937]">
        {props.corteLabel} · Modo práctica
      </div>

      <h3 className="mb-1 text-sm font-semibold text-[#1F2937]">
        {props.title}
      </h3>

      {props.subtitle && (
        <p className="mb-3 text-xs text-[#6B7280]">{props.subtitle}</p>
      )}

      <button
        onClick={props.onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white hover:from-[#3B82F6] hover:to-[#60A5FA]"
      >
        Practicar este corte
      </button>
    </div>
  );
}

function KpiCard(props: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-[#6B7280]">
        {props.label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#1F2937]">
        {props.value ?? "—"}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-[#85B8FC]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dashed border-[#E5E7EB] bg-[#DBEAFE] p-4">
      <div>
        <p className="text-sm text-[#1F2937]">
          Aún no hay estadísticas para mostrar.
        </p>
        <p className="text-xs text-[#6B7280]">
          Realiza tu primer intento para ver promedios y tu historial.
        </p>
      </div>

      <div className="hidden rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#1F2937] md:block">
        Tip: empieza por C1
      </div>
    </div>
  );
}

/* ============ Helpers ============ */

function average(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getNumberOrNull(x: unknown): number | null {
  return typeof x === "number" && !Number.isNaN(x) ? x : null;
}

function formatMaybeNumber(
  x: number | null | undefined,
  decimals = 2,
  suffix?: string
) {
  if (x == null || Number.isNaN(Number(x))) return "—";
  const v = Number(x);
  return `${v.toFixed(decimals)}${suffix ?? ""}`;
}

function StudentStatusPill(props: { status?: string | null }) {
  const status = props.status ?? "DESCONOCIDO";
  let label = status;
  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border";

  if (status === "PRESENTADO") {
    label = "Presentado";
    classes += " bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (status === "EN_PROGRESO") {
    label = "En progreso";
    classes += " bg-amber-50 text-amber-800 border-amber-200";
  } else if (status === "CANCELADO") {
    label = "Cancelado";
    classes += " bg-red-50 text-red-700 border-red-200";
  } else {
    label = status;
    classes += " bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]";
  }

  return <span className={classes}>{label}</span>;
}
