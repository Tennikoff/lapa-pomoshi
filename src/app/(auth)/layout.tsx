import type { ReactNode } from "react";
import styles from "./auth.module.css";

type AuthCSSVars = React.CSSProperties & {
  "--auth-blur"?: string;
  "--auth-dim"?: string;
  "--auth-offset-y"?: string;
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  const authStyle: AuthCSSVars = {
    "--auth-blur": "24px",   // меняй тут
    "--auth-dim": "0.1",    // меняй тут
    "--auth-offset-y": "0px" // меняй тут
  };

  return (
    <div className={styles.authRoot} style={authStyle}>
      <div className={styles.authBg} />
      <div className={styles.authOverlay} />
      <div className={styles.authContent}>{children}</div>
    </div>
  );
}