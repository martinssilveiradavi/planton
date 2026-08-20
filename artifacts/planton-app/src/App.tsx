import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@workspace/planton-ds/components/ui/toaster';
import { TooltipProvider } from '@workspace/planton-ds/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { Navbar } from '@/components/navbar';
import Discovery from '@/pages/discovery';
import ShiftDetail from '@/pages/shift-detail';
import Publish from '@/pages/publish';
import MyShifts from '@/pages/my-shifts';
import Candidates from '@/pages/candidates';
import Login from '@/pages/login';
import Register from '@/pages/register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route>
          <div className="flex flex-col min-h-[100dvh] bg-background">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Discovery} />
                <Route path="/shifts/:id" component={ShiftDetail} />
                <Route path="/publish" component={Publish} />
                <Route path="/my-shifts" component={MyShifts} />
                <Route path="/candidates/:shiftId" component={Candidates} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
