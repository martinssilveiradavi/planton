import type { ReactNode } from "react";
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import Subscription from "../pages/subscription";

export function DoctorAccessGate({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    },
  });

  if (isLoading || !user || user.type !== "doctor") {
    return <>{children}</>;
  }

  if (user.subscription?.status !== "ATIVA") {
    return <Subscription />;
  }

  return <>{children}</>;
}