import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from '@/app/routes';
import { AppProviders } from '@/app/providers/AppProviders';

const router = createAppRouter();

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
