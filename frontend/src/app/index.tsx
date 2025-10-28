import { AuthProvider } from '../auth/AuthContext';
import AppRouter from './router';

export default function AppRoot() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
