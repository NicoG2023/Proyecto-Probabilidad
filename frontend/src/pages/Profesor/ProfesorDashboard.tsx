// src/pages/Profesor/ProfesorDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStrict } from "../../auth/AuthContext";

import { ProfesorAPI } from "../../api/profesorApi";
import type {
  StudentSummaryDto,
  StudentQuizAttemptDto,
  StudentAttemptsChartDto,
  StudentPassedChartDto,
} from "../../api/profesorApi";

export default function ProfesorDashboard() {
  const { ready, authenticated } = useAuthStrict();
  const navigate = useNavigate();

  const [loadingCharts, setLoadingCharts] = useState(true);
  const [topAttempts, setTopAttempts] = useState<StudentAttemptsChartDto[]>([]);
  const [topPassed, setTopPassed] = useState<StudentPassedChartDto[]>([]);
  const [chartsError, setChartsError] = useState<string | null>(null);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents] = useState<StudentSummaryDto[]>([]);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [selectedStudent, setSelectedStudent] =
    useState<StudentSummaryDto | null>(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attempts, setAttempts] = useState<StudentQuizAttemptDto[]>([]);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar gráficas
  useEffect(() => {
    if (!ready || !authenticated) return;
    let mounted = true;

    (async () => {
      setLoadingCharts(true);
      setChartsError(null);
      try {
        const [topA, topP] = await Promise.all([
          ProfesorAPI.topPorIntentos(10),
          ProfesorAPI.topPorAprobados(60, 5),
        ]);
        if (!mounted) return;
        setTopAttempts(topA ?? []);
        setTopPassed(topP ?? []);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setChartsError(
          e?.message ?? "No se pudieron cargar las estadísticas."
        );
        setTopAttempts([]);
        setTopPassed([]);
      } finally {
        mounted && setLoadingCharts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated]);

  // Cargar alumnos
  useEffect(() => {
    if (!ready || !authenticated) return;
    let mounted = true;

    (async () => {
      setLoadingStudents(true);
      setStudentsError(null);
      try {
        const data = await ProfesorAPI.listarAlumnos();
        if (!mounted) return;
        setStudents(data ?? []);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setStudentsError(
          e?.message ?? "No se pudo cargar la lista de alumnos."
        );
        setStudents([]);
      } finally {
        mounted && setLoadingStudents(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated]);

  // Cargar intentos del alumno seleccionado (para el modal)
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!selectedStudent) {
      setAttempts([]);
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingAttempts(true);
      setAttemptsError(null);
      try {
        const data = await ProfesorAPI.intentosDeAlumno(selectedStudent.id);
        if (!mounted) return;
        setAttempts(data ?? []);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setAttemptsError(
          e?.message ?? "No se pudieron cargar los intentos del estudiante."
        );
        setAttempts([]);
      } finally {
        mounted && setLoadingAttempts(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, authenticated, selectedStudent]);

  const handleConsultar = (student: StudentSummaryDto) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Datos para las gráficas (normalizados)
  const maxAttempts = useMemo(
    () => topAttempts.reduce((max, s) => Math.max(max, s.attemptsCount), 0),
    [topAttempts]
  );

  const maxPassed = useMemo(
    () => topPassed.reduce((max, s) => Math.max(max, s.passedCount), 0),
    [topPassed]
  );

  return (
    // <section className="min-h-screen bg-gray-950 text-gray-100">
    //   <div className="mx-auto max-w-6xl px-4 py-10">
    //     {/* Encabezado */}
    //     <header className="mb-8 flex items-center justify-between">
    //       <h1 className="text-2xl font-semibold tracking-tight">
    //         Panel del Profesor
    //       </h1>
    //       <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300">
    //         Seguimiento de alumnos · Quices
    //       </span>
    //     </header>

    //     {/* ================= Gráficas ================= */}
    //     <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 shadow-sm">
    //       <div className="mb-4 flex items-center justify-between">
    //         <h2 className="text-lg font-medium text-gray-200">
    //           Estadísticas generales
    //         </h2>
    //         {chartsError && (
    //           <span className="text-xs text-amber-300">{chartsError}</span>
    //         )}
    //       </div>

    //       {loadingCharts ? (
    //         <div className="grid gap-6 md:grid-cols-2">
    //           <SkeletonChart />
    //           <SkeletonChart />
    //         </div>
    //       ) : (
    //         <div className="grid gap-6 md:grid-cols-2">
    //           <ChartCard
    //             title="Top 10 alumnos por quices realizados"
    //             subtitle="Cantidad total de intentos por alumno"
    //           >
    //             {topAttempts.length === 0 ? (
    //               <EmptyChartState />
    //             ) : (
    //               <SimpleBarChart
    //                 data={topAttempts}
    //                 getLabel={(d) => d.username ?? `ID ${d.studentId}`}
    //                 getValue={(d) => d.attemptsCount}
    //                 maxValue={maxAttempts}
    //               />
    //             )}
    //           </ChartCard>

    //           <ChartCard
    //             title="Top 5 alumnos por quices aprobados"
    //             subtitle="Quices con nota ≥ 60"
    //           >
    //             {topPassed.length === 0 ? (
    //               <EmptyChartState />
    //             ) : (
    //               <SimpleBarChart
    //                 data={topPassed}
    //                 getLabel={(d) => d.username ?? `ID ${d.studentId}`}
    //                 getValue={(d) => d.passedCount}
    //                 maxValue={maxPassed}
    //                 accent="amber"
    //               />
    //             )}
    //           </ChartCard>
    //         </div>
    //       )}
    //     </section>

    //     {/* ================= Tabla de alumnos ================= */}
    //     <section className="mt-10">
    //       <h2 className="mb-4 text-lg font-medium text-gray-200">
    //         Alumnos y quices
    //       </h2>

    //       <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
    //         <div className="mb-3 flex items-center justify-between">
    //           <h3 className="text-sm font-medium text-gray-200">
    //             Lista de alumnos
    //           </h3>
    //           {studentsError && (
    //             <span className="text-xs text-amber-300">{studentsError}</span>
    //           )}
    //         </div>

    //         {loadingStudents ? (
    //           <SkeletonTable />
    //         ) : students.length === 0 ? (
    //           <EmptyState
    //             title="Aún no hay alumnos con quices."
    //             subtitle="Cuando los estudiantes presenten sus quices, aparecerán aquí."
    //           />
    //         ) : (
    //           <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-800/80 bg-gray-950/40">
    //             <table className="w-full table-auto border-collapse text-sm">
    //               <thead>
    //                 <tr className="bg-gray-900/80 text-left text-xs uppercase tracking-wide text-gray-400">
    //                   <th className="border-b border-gray-800 px-3 py-2">
    //                     Alumno
    //                   </th>
    //                   <th className="border-b border-gray-800 px-3 py-2">
    //                     Intentos
    //                   </th>
    //                   <th className="border-b border-gray-800 px-3 py-2">
    //                     Promedio
    //                   </th>
    //                   <th className="border-b border-gray-800 px-3 py-2 text-right">
    //                     Acciones
    //                   </th>
    //                 </tr>
    //               </thead>
    //               <tbody>
    //                 {students.map((s) => (
    //                   <tr
    //                     key={s.id}
    //                     className="border-b border-gray-900/60 text-xs last:border-b-0 hover:bg-gray-800/40"
    //                   >
    //                     <td className="px-3 py-2 align-middle">
    //                       <div className="flex flex-col">
    //                         <span className="text-gray-100">
    //                           {s.username ?? `ID ${s.id}`}
    //                         </span>
    //                         {s.email && (
    //                           <span className="text-[11px] text-gray-400">
    //                             {s.email}
    //                           </span>
    //                         )}
    //                       </div>
    //                     </td>
    //                     <td className="px-3 py-2 align-middle text-gray-200">
    //                       {s.attemptsCount ?? 0}
    //                     </td>
    //                     <td className="px-3 py-2 align-middle text-gray-200">
    //                       {formatMaybeNumber(s.avgScore, 1, "%")}
    //                     </td>
    //                     <td className="px-3 py-2 align-middle text-right">
    //                       <button
    //                         onClick={() => handleConsultar(s)}
    //                         className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-1.5 text-[11px] font-medium text-gray-900 shadow-sm shadow-amber-500/40 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
    //                       >
    //                         Consultar
    //                       </button>
    //                     </td>
    //                   </tr>
    //                 ))}
    //               </tbody>
    //             </table>
    //           </div>
    //         )}
    //       </div>
    //     </section>
    //   </div>

    //   {/* ========= Modal de quices del alumno ========= */}
    //   {isModalOpen && selectedStudent && (
    //     <AttemptsModal
    //       student={selectedStudent}
    //       attempts={attempts}
    //       loading={loadingAttempts}
    //       error={attemptsError}
    //       onClose={closeModal}
    //       onPreview={(attemptId) => {
    //         setIsModalOpen(false);
    //         navigate(`/preview/intentos/${attemptId}`);
    //       }}
    //     />
    //   )}
    // </section>
    <section className="min-h-screen bg-white text-black">
  <div className="mx-auto max-w-6xl px-4 py-10">

    {/* Encabezado */}
    <header className="mb-8 flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">Panel del Profesor</h1>

      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
        Seguimiento de alumnos · Quices
      </span>
    </header>

    {/* ================= Gráficas ================= */}
    <section className="rounded-2xl border border-gray-300 bg-gray-100 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Estadísticas generales</h2>

        {chartsError && (
          <span className="text-xs text-amber-600">{chartsError}</span>
        )}
      </div>

      {loadingCharts ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Top 10 alumnos por quices realizados"
            subtitle="Cantidad total de intentos por alumno"
          >
            {topAttempts.length === 0 ? (
              <EmptyChartState />
            ) : (
              <SimpleBarChart
                data={topAttempts}
                getLabel={(d) => d.username ?? `ID ${d.studentId}`}
                getValue={(d) => d.attemptsCount}
                maxValue={maxAttempts}
              />
            )}
          </ChartCard>

          <ChartCard
            title="Top 5 alumnos por quices aprobados"
            subtitle="Quices con nota ≥ 60"
          >
            {topPassed.length === 0 ? (
              <EmptyChartState />
            ) : (
              <SimpleBarChart
                data={topPassed}
                getLabel={(d) => d.username ?? `ID ${d.studentId}`}
                getValue={(d) => d.passedCount}
                maxValue={maxPassed}
                accent="amber"
              />
            )}
          </ChartCard>
        </div>
      )}
    </section>

    {/* ================= Tabla de alumnos ================= */}
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-medium text-gray-800">Alumnos y quices</h2>

      <div className="rounded-2xl border border-gray-300 bg-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Lista de alumnos</h3>
          {studentsError && (
            <span className="text-xs text-amber-600">{studentsError}</span>
          )}
        </div>

        {loadingStudents ? (
          <SkeletonTable />
        ) : students.length === 0 ? (
          <EmptyState
            title="Aún no hay alumnos con quices."
            subtitle="Cuando los estudiantes presenten sus quices, aparecerán aquí."
          />
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-300 bg-gray-50">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-[#85B8FC] text-left text-xs uppercase tracking-wide text-gray-600">
                  <th className="border-b border-gray-300 px-3 py-2">Alumno</th>
                  <th className="border-b border-gray-300 px-3 py-2">Intentos</th>
                  <th className="border-b border-gray-300 px-3 py-2">Promedio</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-200 text-xs last:border-b-0 hover:bg-gray-100"
                  >
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-gray-900">
                          {s.username ?? `ID ${s.id}`}
                        </span>
                        {s.email && (
                          <span className="text-[11px] text-gray-600">
                            {s.email}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 align-middle text-gray-800">
                      {s.attemptsCount ?? 0}
                    </td>

                    <td className="px-3 py-2 align-middle text-gray-800">
                      {formatMaybeNumber(s.avgScore, 1, "%")}
                    </td>

                    <td className="px-3 py-2 align-middle text-right">
                      <button
                        onClick={() => handleConsultar(s)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-3 py-1.5 text-[11px] font-medium text-black shadow-sm shadow-amber-300/40 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                      >
                        Consultar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  </div>

  {/* ========= Modal de quices del alumno ========= */}
  {isModalOpen && selectedStudent && (
    <AttemptsModal
      student={selectedStudent}
      attempts={attempts}
      loading={loadingAttempts}
      error={attemptsError}
      onClose={closeModal}
      onPreview={(attemptId) => {
        setIsModalOpen(false);
        navigate(`/preview/intentos/${attemptId}`);
      }}
    />
  )}
</section>

  );
}

/* ================== Modal ================== */

// function AttemptsModal(props: {
//   student: StudentSummaryDto;
//   attempts: StudentQuizAttemptDto[];
//   loading: boolean;
//   error: string | null;
//   onClose: () => void;
//   onPreview: (attemptId: number) => void;
// }) {
//   const { student, attempts, loading, error, onClose, onPreview } = props;

//   return (
//     <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
//       <div className="relative w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-950/95 p-5 shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <h3 className="text-base font-semibold text-gray-100">
//               Quices de {student.username ?? `ID ${student.id}`}
//             </h3>
//             {student.email && (
//               <p className="text-xs text-gray-400">{student.email}</p>
//             )}
//           </div>
//           <button
//             onClick={onClose}
//             className="inline-flex h-8 items-center justify-center rounded-full border border-gray-700 bg-gray-900 px-3 text-xs text-gray-300 hover:bg-gray-800"
//           >
//             Cerrar
//           </button>
//         </div>

//         {error && (
//           <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
//             {error}
//           </div>
//         )}

//         {loading ? (
//           <SkeletonTable />
//         ) : attempts.length === 0 ? (
//           <EmptyState
//             title="Este alumno aún no tiene quices."
//             subtitle="Cuando el alumno presente quices, verás aquí su historial."
//           />
//         ) : (
//           <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-800/80 bg-gray-950/40">
//             <table className="w-full table-auto border-collapse text-sm">
//               <thead>
//                 <tr className="bg-gray-900/80 text-left text-xs uppercase tracking-wide text-gray-400">
//                   <th className="border-b border-gray-800 px-3 py-2">Quiz</th>
//                   <th className="border-b border-gray-800 px-3 py-2">Corte</th>
//                   <th className="border-b border-gray-800 px-3 py-2">Nota</th>
//                   <th className="border-b border-gray-800 px-3 py-2">Estado</th>
//                   <th className="border-b border-gray-800 px-3 py-2 text-right">
//                     Acciones
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {attempts.map((it) => (
//                   <tr
//                     key={it.attemptId}
//                     className="border-b border-gray-900/60 text-xs last:border-b-0 hover:bg-gray-800/40"
//                   >
//                     <td className="px-3 py-2 align-middle">
//                       <div className="flex flex-col">
//                         <span className="text-gray-100">{it.quizTitle}</span>
//                         <span className="text-[11px] text-gray-500">
//                           ID {it.attemptId}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-3 py-2 align-middle text-gray-200">
//                       {it.corte}
//                     </td>
//                     <td className="px-3 py-2 align-middle text-gray-200">
//                       {formatMaybeNumber(it.score, 1, "%")}
//                     </td>
//                     <td className="px-3 py-2 align-middle">
//                       <StatusPill status={it.status} />
//                     </td>
//                     <td className="px-3 py-2 align-middle text-right">
//                       <button
//                         onClick={() => onPreview(it.attemptId)}
//                         className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-1.5 text-[11px] font-medium text-gray-900 shadow-sm shadow-amber-500/40 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
//                       >
//                         Consultar
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
function AttemptsModal(props: {
  student: StudentSummaryDto;
  attempts: StudentQuizAttemptDto[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onPreview: (attemptId: number) => void;
}) {
  const { student, attempts, loading, error, onClose, onPreview } = props;

 return (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
    <div className="relative w-full max-w-3xl rounded-xl border border-gray-300 bg-white p-5 shadow-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Quices de {student.username ?? `ID ${student.id}`}
          </h3>
          {student.email && (
            <p className="text-xs text-gray-600">{student.email}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="inline-flex h-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-3 text-xs text-gray-800 hover:bg-gray-200"
        >
          Cerrar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <SkeletonTable />
      ) : attempts.length === 0 ? (
        <EmptyState
          title="Este alumno aún no tiene quices."
          subtitle="Cuando el alumno presente quices, verás aquí su historial."
        />
      ) : (
        <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-300 bg-gray-50">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-[#85B8FC] text-left text-xs uppercase tracking-wide text-gray-700">
                <th className="border-b border-gray-300 px-3 py-2">Quiz</th>
                <th className="border-b border-gray-300 px-3 py-2">Corte</th>
                <th className="border-b border-gray-300 px-3 py-2">Nota</th>
                <th className="border-b border-gray-300 px-3 py-2">Estado</th>
                <th className="border-b border-gray-300 px-3 py-2 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((it) => (
                <tr
                  key={it.attemptId}
                  className="border-b border-gray-200 text-xs last:border-b-0 hover:bg-gray-100"
                >
                  <td className="px-3 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-gray-900">{it.quizTitle}</span>
                      <span className="text-[11px] text-gray-500">
                        ID {it.attemptId}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle text-gray-800">
                    {it.corte}
                  </td>
                  <td className="px-3 py-2 align-middle text-gray-800">
                    {formatMaybeNumber(it.score, 1, "%")}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <StatusPill status={it.status} />
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <button
                      onClick={() => onPreview(it.attemptId)}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-900 hover:bg-gray-300"
                    >
                      Consultar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
}

/* ================== Componentes UI auxiliares ================== */

// function ChartCard(props: {
//   title: string;
//   subtitle?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
//       <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-gradient-to-br from-blue-600 to-amber-500 opacity-20 blur-2xl" />
//       <div className="mb-3">
//         <h3 className="text-sm font-semibold text-gray-100">{props.title}</h3>
//         {props.subtitle && (
//           <p className="mt-1 text-xs text-gray-400">{props.subtitle}</p>
//         )}
//       </div>
//       <div className="relative z-10">{props.children}</div>
//     </div>
//   );
// }
function ChartCard(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-700 bg-gray-900/80 p-4">
      {/* Fondo decorativo eliminado o reemplazado por gris neutro */}
      <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-gray-800 opacity-20 blur-2xl" />

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-100">{props.title}</h3>
        {props.subtitle && (
          <p className="mt-1 text-xs text-gray-400">{props.subtitle}</p>
        )}
      </div>

      <div className="relative z-10">{props.children}</div>
    </div>
  );
}


function SimpleBarChart<T>(props: {
  data: T[];
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  maxValue: number;
  accent?: "blue" | "amber" | "slate";
}) {
  const { data, getLabel, getValue, maxValue } = props;
  const accent = props.accent ?? "blue";

  const barClass =
    accent === "amber"
      ? "from-amber-500 to-amber-300"
      : accent === "slate"
      ? "from-slate-500 to-slate-300"
      : "from-blue-500 to-blue-300";

  const max = maxValue > 0 ? maxValue : 1;
  const maxHeight = 140;

  return (
    <div className="flex h-52 items-end gap-3 overflow-x-auto pt-2">
      {data.map((d, idx) => {
        const value = getValue(d);
        const ratio = Math.max(0, Math.min(1, value / max));
        const height = Math.max(8, ratio * maxHeight);
        const label = getLabel(d);

        return (
          <div
            key={idx}
            className="flex min-w-[48px] flex-1 flex-col items-center text-[10px]"
          >
            <div className="mb-1 text-[11px] text-gray-300">{value}</div>
            <div
              className={`w-7 rounded-t-xl bg-gradient-to-t ${barClass}`}
              style={{ height }}
            />
            <div
              className="mt-1 line-clamp-2 text-center text-[10px] text-gray-400"
              title={label}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-gray-800" />
      <div className="mb-1 h-3 w-48 animate-pulse rounded bg-gray-800" />
      <div className="mt-4 flex h-40 items-end gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-7 animate-pulse rounded-t-xl bg-gray-800"
            style={{ height: `${40 + i * 5}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-md bg-gray-800/60"
        />
      ))}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-950/40 px-4">
      <p className="text-xs text-gray-400">
        Aún no hay suficientes datos para mostrar esta gráfica.
      </p>
    </div>
  );
}

function EmptyState(props: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-800 bg-gray-900/30 p-4">
      <div>
        <p className="text-sm text-gray-300">{props.title}</p>
        {props.subtitle && (
          <p className="text-xs text-gray-500">{props.subtitle}</p>
        )}
      </div>
      <div className="hidden rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300 md:block">
        Vista del profesor
      </div>
    </div>
  );
}

function StatusPill(props: { status: string }) {
  const { status } = props;
  let label = status;
  let cls =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";

  if (status === "PRESENTADO") {
    cls += " bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
    label = "Presentado";
  } else if (status === "EN_PROGRESO") {
    cls += " bg-amber-500/15 text-amber-300 border border-amber-500/40";
    label = "En progreso";
  } else if (status === "CANCELADO") {
    cls += " bg-red-500/15 text-red-300 border border-red-500/40";
    label = "Cancelado";
  } else {
    cls += " bg-gray-700 text-gray-200";
  }

  return <span className={cls}>{label}</span>;
}

/* ================== Helpers ================== */

function formatMaybeNumber(
  x: number | null | undefined,
  decimals = 2,
  suffix?: string
) {
  if (x == null || Number.isNaN(Number(x))) return "—";
  const v = Number(x);
  return `${v.toFixed(decimals)}${suffix ?? ""}`;
}
