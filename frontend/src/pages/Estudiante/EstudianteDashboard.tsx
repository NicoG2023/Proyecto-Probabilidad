// src/pages/EstudianteDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { EstudianteAPI as API } from "../../api/estudianteApi";
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

  // Carga estadísticas
  useEffect(() => {
    if (!ready || !authenticated) return;  // ⬅️ clave
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
    return () => { mounted = false; };
  }, [ready, authenticated]);

  // Carga últimos intentos
  useEffect(() => {
    if (!ready || !authenticated) return;  // ⬅️ clave
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
    return () => { mounted = false; };
  }, [ready, authenticated]);

  // Normaliza promedios de C3 cuando vienen C3A/C3B
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

  const handleStartQuiz = async (corte: Corte) => {
    try {
      setStarting(corte);
      setError(null);
      const dto: IntentoCreadoDTO = await API.crearIntento(corte);
      navigate(`/estudiante/quices/${dto.intentoId}`);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message ??
          "No se pudo iniciar el intento. Intenta de nuevo."
      );
    } finally {
      setStarting(null);
    }
  };

  return (
    <section className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Encabezado */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Panel del Estudiante
          </h1>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
            Quices · C1 · C2 · C3
          </span>
        </header>

        {/* Acciones: Tomar Quiz */}
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
            accent="amber"
            loading={starting === "C2"}
            onClick={() => handleStartQuiz("C2")}
          />
          <ActionCard
            title="Tomar Quiz - Corte 3"
            subtitle="Tercer corte (C3)"
            accent="slate"
            loading={starting === "C3"}
            onClick={() => handleStartQuiz("C3")}
          />
        </div>

        {/* Error global */}
        {error && (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
            {error}
          </div>
        )}

        {/* Estadísticas */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-gray-200">
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
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="mb-3 text-base font-medium text-gray-200">
              Últimos intentos
            </h3>

            {loadingHist ? (
              <SkeletonTable />
            ) : historial.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="border-b border-gray-800 px-2 py-2">ID</th>
                    <th className="border-b border-gray-800 px-2 py-2">Corte</th>
                    <th className="border-b border-gray-800 px-2 py-2">Nota</th>
                    <th className="border-b border-gray-800 px-2 py-2">Estado</th>
                    <th className="border-b border-gray-800 px-2 py-2">Fecha</th>
                    <th className="border-b border-gray-800 px-2 py-2 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-800/40">
                      <td className="border-b border-gray-800 px-2 py-2">
                        {it.id}
                      </td>
                      <td className="border-b border-gray-800 px-2 py-2">
                        {it?.quiz?.corte ?? "—"}
                      </td>
                      <td className="border-b border-gray-800 px-2 py-2">
                        {formatMaybeNumber(it?.score, 2, "%")}
                      </td>

                      {/* ESTADO */}
                      <td className="border-b border-gray-800 px-2 py-2">
                        <StudentStatusPill status={it.status} />
                      </td>

                      {/* FECHA */}
                      <td className="border-b border-gray-800 px-2 py-2">
                        {it.submittedAt
                          ? new Date(it.submittedAt).toLocaleString()
                          : it.startedAt
                          ? new Date(it.startedAt).toLocaleString()
                          : "—"}
                      </td>

                      {/* ACCIONES */}
                      <td className="border-b border-gray-800 px-2 py-2 text-right">
                        {it.status && it.status !== "PRESENTADO" ? (
                          <button
                            onClick={() => navigate(`/estudiante/quices/${it.id}`)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-95"
                          >
                            {it.status === "EN_PROGRESO" ? "Continuar" : "Retomar"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500">—</span>
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
      ? "from-blue-600 to-blue-500"
      : props.accent === "amber"
      ? "from-amber-600 to-amber-500"
      : "from-slate-600 to-slate-500";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-sm">
      <div
        className={`absolute right-[-30px] top-[-30px] h-28 w-28 rounded-full bg-gradient-to-br ${accentClasses} opacity-30 blur-lg`}
      />
      <h3 className="mb-1 text-base font-semibold text-gray-100">
        {props.title}
      </h3>
      {props.subtitle && (
        <p className="mb-4 text-sm text-gray-400">{props.subtitle}</p>
      )}
      <button
        onClick={props.onClick}
        disabled={props.loading}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-amber-500 px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
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

function KpiCard(props: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {props.label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-100">
        {props.value ?? "—"}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-gray-800/50" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-4">
      <div>
        <p className="text-sm text-gray-300">
          Aún no hay estadísticas para mostrar.
        </p>
        <p className="text-xs text-gray-500">
          Realiza tu primer intento para ver promedios y tu historial.
        </p>
      </div>
      <div className="hidden rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300 md:block">
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
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";

  if (status === "PRESENTADO") {
    label = "Presentado";
    classes +=
      " bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  } else if (status === "EN_PROGRESO") {
    label = "En progreso";
    classes +=
      " bg-amber-500/15 text-amber-300 border border-amber-500/40";
  } else if (status === "CANCELADO") {
    label = "Cancelado";
    classes += " bg-red-500/15 text-red-300 border border-red-500/40";
  } else {
    label = status;
    classes += " bg-gray-700 text-gray-200";
  }

  return <span className={classes}>{label}</span>;
}

