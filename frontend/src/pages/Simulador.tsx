import { useState } from "react";
import { Link } from "react-router-dom";

// ======================
// Tipos
// ======================
type Combatiente = { name: string; p: number };

type MonteCarloResult = {
  probTable: number[][];
  maxRounds: number;
  winnerCounts: Record<string, number>;
  trials: number;
};

type SingleRunLogEntry = {
  round: number;
  before: number;
  after: number;
  deaths: string[];
};

type SingleRunResult = {
  log: SingleRunLogEntry[];
  finalAliveNames: string[];
};

// ======================
// Utilidades fracciones
// ======================
function evalFraction(str: string): number {
  str = str.trim();
  if (str.includes("/")) {
    const [a, b] = str.split("/");
    const num = parseFloat(a);
    const den = parseFloat(b);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return NaN;
    return num / den;
  }
  const dec = parseFloat(str);
  return Number.isFinite(dec) ? dec : NaN;
}

function validateFraction(str: string): string | null {
  if (!str.trim()) return "Campo vacío";

  // decimal simple
  if (!str.includes("/")) {
    const dec = parseFloat(str);
    if (!Number.isFinite(dec) || dec < 0 || dec > 1) {
      return "Debe ser un número entre 0 y 1.";
    }
    return null;
  }

  // fracción a/b
  const parts = str.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return "Fracción inválida.";

  const num = Number(parts[0]);
  const den = Number(parts[1]);

  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) {
    return "Numerador y denominador inválidos.";
  }

  if (num / den > 1) return "La fracción no puede ser mayor que 1.";

  return null;
}

// ======================
// Simulación
// ======================
function simulateOneRun(template: Combatiente[]): number[] {
  const alive = template.map((c) => ({ ...c, alive: true as boolean }));
  const rounds: number[] = [];

  const aliveList = () => alive.filter((x) => x.alive);
  const aliveCount = () => aliveList().length;

  let round = 0;
  while (true) {
    const before = aliveCount();
    if (before <= 1) break;
    round++;

    const toDie = new Set<string>();
    const living = aliveList();
    for (const attacker of living) {
      if (Math.random() < attacker.p) {
        const targets = living.filter((t) => t !== attacker);
        if (targets.length === 0) continue;
        const target = targets[Math.floor(Math.random() * targets.length)];
        toDie.add(target.name);
      }
    }

    for (const person of alive) {
      if (toDie.has(person.name)) person.alive = false;
    }

    const after = aliveCount();
    rounds.push(after);
    if (after <= 1) break;
    if (round > 1000) break; // seguridad
  }

  return rounds;
}

function simulateOneRunFinalNames(template: Combatiente[]): string[] {
  const alive = template.map((c) => ({ ...c, alive: true as boolean }));

  const aliveList = () => alive.filter((x) => x.alive);
  const aliveCount = () => aliveList().length;

  let round = 0;
  while (true) {
    const before = aliveCount();
    if (before <= 1) break;
    round++;

    const toDie = new Set<string>();
    const living = aliveList();
    for (const attacker of living) {
      if (Math.random() < attacker.p) {
        const targets = living.filter((t) => t !== attacker);
        if (targets.length === 0) continue;
        const target = targets[Math.floor(Math.random() * targets.length)];
        toDie.add(target.name);
      }
    }

    for (const person of alive) {
      if (toDie.has(person.name)) person.alive = false;
    }

    const after = aliveCount();
    if (after <= 1) break;
    if (round > 1000) break;
  }

  return alive.filter((x) => x.alive).map((x) => x.name);
}

function simulateOneRunDetailed(template: Combatiente[]): SingleRunResult {
  const alive = template.map((c) => ({ ...c, alive: true as boolean }));
  const log: SingleRunLogEntry[] = [];

  const aliveList = () => alive.filter((x) => x.alive);
  const aliveCount = () => aliveList().length;

  let round = 0;
  while (true) {
    const before = aliveCount();
    if (before <= 1) break;
    round++;

    const toDie = new Set<string>();
    const living = aliveList();
    for (const attacker of living) {
      if (Math.random() < attacker.p) {
        const targets = living.filter((t) => t !== attacker);
        if (targets.length === 0) continue;
        const target = targets[Math.floor(Math.random() * targets.length)];
        toDie.add(target.name);
      }
    }

    for (const person of alive) {
      if (toDie.has(person.name)) person.alive = false;
    }

    const after = aliveCount();
    log.push({
      round,
      before,
      after,
      deaths: Array.from(toDie),
    });

    if (after <= 1) break;
    if (round > 1000) break;
  }

  return {
    log,
    finalAliveNames: alive.filter((x) => x.alive).map((x) => x.name),
  };
}

function runMonteCarlo(
  template: Combatiente[],
  trials: number,
  optionalMaxRounds: number | null
): MonteCarloResult {
  const n = template.length;

  const allRuns: number[][] = [];
  let maxRoundsObserved = 0;

  for (let t = 0; t < trials; t++) {
    const run = simulateOneRun(template);
    allRuns.push(run);
    if (run.length > maxRoundsObserved) maxRoundsObserved = run.length;
  }

  const winnerCounts: Record<string, number> = {};
  for (const c of template) winnerCounts[c.name] = 0;
  winnerCounts["none"] = 0;

  for (let t = 0; t < trials; t++) {
    const finalAliveNames = simulateOneRunFinalNames(template);
    if (finalAliveNames.length === 1) {
      winnerCounts[finalAliveNames[0]]++;
    } else if (finalAliveNames.length === 0) {
      winnerCounts["none"]++;
    }
  }

  const maxR =
    optionalMaxRounds && optionalMaxRounds > 0
      ? Math.min(optionalMaxRounds, Math.max(maxRoundsObserved, 1))
      : Math.max(maxRoundsObserved, 1);

  const table: number[][] = [];
  for (let r = 0; r < maxR; r++) {
    table[r] = new Array(n + 1).fill(0);
  }

  for (let t = 0; t < trials; t++) {
    const run = allRuns[t];
    const lastIdx = run.length - 1;
    for (let r = 0; r < maxR; r++) {
      let value: number;
      if (r <= lastIdx) {
        value = run[r];
      } else {
        value = run.length === 0 ? template.length : run[lastIdx];
      }
      table[r][value] += 1;
    }
  }

  const probTable = table.map((row) => row.map((c) => c / trials));

  return {
    probTable,
    maxRounds: maxR,
    winnerCounts,
    trials,
  };
}

function buildCSV(res: MonteCarloResult, n: number): string {
  const rows: string[] = [];
  const header = ["Asalto"];
  for (let k = 0; k <= n; k++) header.push(`${k}_vivos`);
  rows.push(header.join(","));

  for (let r = 0; r < res.maxRounds; r++) {
    const row: string[] = [`${r + 1}`];
    for (let k = 0; k <= n; k++) {
      row.push((res.probTable[r][k] || 0).toFixed(6));
    }
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

// ======================
// COMPONENTE PRINCIPAL
// ======================
export default function Simulador() {
  const [combatientes, setCombatientes] = useState<Combatiente[]>([
    { name: "A", p: 0.5 },
    { name: "B", p: 0.4 },
    { name: "C", p: 0.6 },
  ]);

  const [name, setName] = useState("");
  const [prob, setProb] = useState("");
  const [fractionError, setFractionError] = useState<string | null>(null);
  const [fractionPreview, setFractionPreview] = useState<{ num: string; den: string } | null>(null);

  const [trials, setTrials] = useState(5000);
  const [maxRounds, setMaxRounds] = useState<number | null>(null);

  const [results, setResults] = useState<MonteCarloResult | null>(null);
  const [singleRun, setSingleRun] = useState<SingleRunResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // -------------------------------
  // FRACTION LIVE PREVIEW
  // -------------------------------
  const onProbChange = (val: string) => {
    setProb(val);
    const err = validateFraction(val);
    setFractionError(err);

    if (!err && val.includes("/")) {
      const [num, den] = val.split("/");
      setFractionPreview({ num, den });
    } else {
      setFractionPreview(null);
    }
  };

  // -------------------------------
  // AGREGAR / ELIMINAR COMBATIENTE
  // -------------------------------
  const addCombatiente = () => {
    if (!name.trim()) {
      alert("Ingresa un nombre.");
      return;
    }

    const err = validateFraction(prob);
    if (err) {
      alert(err);
      return;
    }

    const p = evalFraction(prob);
    if (!Number.isFinite(p)) {
      alert("Probabilidad inválida.");
      return;
    }

    setCombatientes((prev) => [...prev, { name: name.trim(), p: +p.toFixed(6) }]);
    setName("");
    setProb("");
    setFractionPreview(null);
    setFractionError(null);
  };

  const removeCombatiente = (i: number) => {
    setCombatientes((prev) => prev.filter((_, idx) => idx !== i));
  };

  // -------------------------------
  // ACCIONES SIMULACIÓN
  // -------------------------------
  const handleRunMonteCarlo = () => {
    if (combatientes.length < 2) {
      alert("Agrega al menos 2 combatientes.");
      return;
    }

    const t = Number(trials) || 0;
    if (!Number.isFinite(t) || t <= 0) {
      alert("Número de simulaciones inválido.");
      return;
    }

    setSimulating(true);
    setTimeout(() => {
      const res = runMonteCarlo(combatientes, Math.floor(t), maxRounds);
      setResults(res);
      setSingleRun(null);
      setSimulating(false);
    }, 10);
  };

  const handleSingleRun = () => {
    if (combatientes.length < 2) {
      alert("Agrega al menos 2 combatientes.");
      return;
    }
    const run = simulateOneRunDetailed(combatientes);
    setSingleRun(run);
  };

  const handleDownloadCSV = () => {
    if (!results) return;
    const csv = buildCSV(results, combatientes.length);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "probabilidades_por_asalto.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ======================
  // RENDER
  // ======================
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Botón volver */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-300 transition"
        >
          <span>←</span>
          <span>Volver</span>
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          {/* Intro */}
          <section className="rounded-2xl bg-white p-5 shadow">
            <h1 className="text-lg font-semibold text-gray-900">
              Simulador estocástico de combates
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Agrega combatientes con su probabilidad de acierto (fraccionario entre 0 y 1). La
              simulación corre Monte Carlo y muestra la probabilidad por asalto de que queden{" "}
              <span className="font-semibold">k</span> combatientes.
            </p>
          </section>

          {/* Configuración de combatientes */}
          <section className="rounded-2xl bg-white p-5 shadow space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Nombre del combatiente
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Thor"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Probabilidad de acierto (fraccionario obligatorio, 0 ≤ p ≤ 1)
              </label>
              <input
                value={prob}
                onChange={(e) => onProbChange(e.target.value)}
                placeholder="Ej: 5/8"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />

              <div className="mt-2 flex items-center gap-4">
                {fractionPreview && (
                  <div className="inline-flex flex-col items-center text-blue-600">
                    <span className="text-lg leading-tight">{fractionPreview.num}</span>
                    <span className="block h-[2px] w-full rounded-full bg-blue-500" />
                    <span className="text-lg leading-tight">{fractionPreview.den}</span>
                  </div>
                )}
                {fractionError && (
                  <p className="text-xs text-red-600">{fractionError}</p>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={addCombatiente}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
              >
                Agregar combatiente
              </button>
              <button
                onClick={() => setCombatientes([])}
                className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition"
              >
                Limpiar lista
              </button>
              <span className="ml-auto text-xs text-gray-600">
                Combatientes actuales:{" "}
                <span className="font-semibold">{combatientes.length}</span>
              </span>
            </div>

            {/* Lista de combatientes */}
            {combatientes.length > 0 && (
              <div className="mt-3 space-y-2">
                {combatientes.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-600">p = {c.p}</div>
                    </div>
                    <button
                      onClick={() => removeCombatiente(i)}
                      className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Parámetros de simulación */}
          <section className="rounded-2xl bg-white p-5 shadow space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">
                  Número de simulaciones (Monte Carlo)
                </label>
                <input
                  type="number"
                  min={1}
                  value={trials}
                  onChange={(e) => setTrials(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="sm:w-52">
                <label className="block text-xs font-medium text-gray-700">
                  Máx. asaltos a mostrar (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxRounds ?? ""}
                  onChange={(e) =>
                    setMaxRounds(
                      e.target.value ? Math.max(1, Number(e.target.value)) : null
                    )
                  }
                  placeholder="Vacío = máximo observado"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunMonteCarlo}
                disabled={simulating}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 transition"
              >
                {simulating ? "Simulando..." : "Ejecutar simulación"}
              </button>
              <button
                onClick={handleSingleRun}
                className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition"
              >
                Correr 1 combate de ejemplo
              </button>
              <span className="ml-auto text-xs text-gray-600">
                {simulating ? "Procesando..." : ""}
              </span>
            </div>
          </section>

          {/* Resultados Monte Carlo */}
          {results && (
            <section className="rounded-2xl bg-white p-5 shadow space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Resultados (Monte Carlo)
                </h2>
                <button
                  onClick={handleDownloadCSV}
                  className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                  Exportar tabla CSV
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Simulaciones: <strong>{results.trials}</strong>. Máx. asaltos mostrados:{" "}
                <strong>{results.maxRounds}</strong>.
              </p>

              <div className="overflow-x-auto">
                <table className="mt-2 w-full border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="border-b px-2 py-1 text-left">Asalto</th>
                      {Array.from({ length: combatientes.length + 1 }).map((_, k) => (
                        <th key={k} className="border-b px-2 py-1 text-center">
                          {k} vivos
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: results.maxRounds }).map((_, r) => (
                      <tr key={r}>
                        <th className="border-b px-2 py-1 text-left font-medium">
                          Asalto {r + 1}
                        </th>
                        {Array.from({
                          length: combatientes.length + 1,
                        }).map((_, k) => {
                          const prob = results.probTable[r][k] || 0;
                          return (
                            <td key={k} className="border-b px-2 py-1 text-center">
                              {(prob * 100).toFixed(2)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-gray-700">
                <strong>Distribución de resultados finales: </strong>
                <div className="mt-1 space-y-0.5">
                  {Object.entries(results.winnerCounts).map(([name, cnt]) => (
                    <div key={name}>
                      {name}: {cnt}{" "}
                      <span className="text-[11px] text-gray-500">
                        ({((cnt / results.trials) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Ejemplo de un combate */}
          {singleRun && (
            <section className="rounded-2xl bg-white p-5 shadow space-y-3">
              <h2 className="text-base font-semibold text-gray-900">
                Ejemplo de un combate (una ejecución)
              </h2>
              <p className="text-xs text-gray-600">
                Asaltos simulados: <strong>{singleRun.log.length}</strong>.
              </p>

              {singleRun.log.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No hubo asaltos (posiblemente ya había ≤1 combatientes al inicio).
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="mt-2 w-full border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr>
                        <th className="border-b px-2 py-1">Asalto</th>
                        <th className="border-b px-2 py-1">Antes</th>
                        <th className="border-b px-2 py-1">Después</th>
                        <th className="border-b px-2 py-1">Muertes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {singleRun.log.map((r) => (
                        <tr key={r.round}>
                          <td className="border-b px-2 py-1 text-center">{r.round}</td>
                          <td className="border-b px-2 py-1 text-center">{r.before}</td>
                          <td className="border-b px-2 py-1 text-center">{r.after}</td>
                          <td className="border-b px-2 py-1 text-center">
                            {r.deaths.length ? r.deaths.join(", ") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-2">
                {singleRun.finalAliveNames.length === 1 ? (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    Ganador:{" "}
                    <span className="font-semibold">
                      {singleRun.finalAliveNames[0]}
                    </span>
                  </div>
                ) : singleRun.finalAliveNames.length === 0 ? (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    Todos murieron en el mismo asalto.
                  </div>
                ) : (
                  <div className="text-xs text-gray-700">
                    Estado final: {singleRun.finalAliveNames.length} vivos (
                    {singleRun.finalAliveNames.join(", ")})
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
