
import { ReactNode } from "react";

interface PrivateRouteProps {
  children: ReactNode;
}

// This component now simply renders its children without any auth checks
export default function PrivateRoute({ children }: PrivateRouteProps) {
  return <>{children}</>;
}
