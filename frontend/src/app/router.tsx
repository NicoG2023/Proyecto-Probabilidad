// src/router/index.tsx (o donde definas el router)
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';
import EstudianteDashboard from '../pages/Estudiante/EstudianteDashboard';
import EstudianteQuizPage from '../pages/Estudiante/EstudianteQuizPage';
import AdminPage from '../pages/Admin/AdminPage';
import NotFound from '../pages/NotFound';
import RequireAuth from '../auth/guards/RequireAuth';
import RequireRole from '../auth/guards/RequireRole';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <EstudianteDashboard /> },
      {
        path: 'estudiante/quices/:intentoId',
        element: (
          <RequireAuth>
            <RequireRole role="estudiante">
              <EstudianteQuizPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <AdminPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      { path: '404', element: <NotFound /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
