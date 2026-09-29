import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function AppFrame({
  children,
}: Props) {
  return (
    <div className="app-frame">
      <div className="app-background-glow" />

      <div className="app-content">
        {children}
      </div>
    </div>
  );
}