import { type ReactNode, useEffect } from 'react';
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
import Subscription from '@/pages/subscription';
import { DoctorAccessGate } from '@/components/doctor-access-gate';
import { trackPage } from '@/lib/analytics';

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
        <Route path="/subscription">
          <div className="flex min-h-[100dvh] flex-col bg-background">
            <Navbar />
            <main className="flex-1">
              <Subscription />
            </main>
          </div>
        </Route>
        <Route>
          <div className="flex flex-col min-h-[100dvh] bg-background">
            <Navbar />
            <main className="flex-1">
              <DoctorAccessGate>
                <Switch>
                  <Route path="/" component={Discovery} />
                  <Route path="/shifts/:id" component={ShiftDetail} />
                  <Route path="/publish" component={Publish} />
                  <Route path="/my-shifts" component={MyShifts} />
                  <Route path="/candidates/:shiftId" component={Candidates} />
                  <Route component={NotFound} />
                </Switch>
              </DoctorAccessGate>
            </main>
          </div>
        </Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    void trackPage(location);
  }, [location]);
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
