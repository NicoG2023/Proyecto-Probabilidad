// src/router/AppRouter.tsx (o donde tengas este archivo)
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./AppLayout";
import EstudianteQuizPage from "../pages/Estudiante/EstudianteQuizPage";
import EstudiantePracticaQuizPage from "../pages/Estudiante/EstudiantePracticaQuizPage"; // ⬅️ NUEVO
import AdminPage from "../pages/Admin/AdminPage";
import ProfesorDashboard from "../pages/Profesor/ProfesorDashboard";
import QuizPreviewPage from "../pages/QuizPreviewPage";
import NotFound from "../pages/NotFound";
import RequireAuth from "../auth/guards/RequireAuth";
import RequireRole from "../auth/guards/RequireRole";
import HomeLanding from "./router/HomeLanding";
import Simulador from "../pages/Simulador";


const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <HomeLanding />
          </RequireAuth>
        ),
      },
      {
        path: "estudiante/quices/:intentoId",
        element: (
          <RequireAuth>
            <RequireRole role="estudiante">
              <EstudianteQuizPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "estudiante/practica/:corte",
        element: (
          <RequireAuth>
            <RequireRole role="estudiante">
              <EstudiantePracticaQuizPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <AdminPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "profesor",
        element: (
          <RequireAuth>
            <RequireRole role="profesor">
              <ProfesorDashboard />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: "preview/intentos/:intentoId",
        element: (
          <RequireAuth>
            <RequireRole role="profesor">
              <QuizPreviewPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      { path: "404", element: <NotFound /> },
      {
        path: "/simulador",
        element: <Simulador />,
}
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
