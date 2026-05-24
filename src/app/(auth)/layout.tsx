import type { ReactNode } from "react";
import styles from "./auth.module.css";
import { LandingPage } from "../../components/landing/LandingPage";

type ModalVars = React.CSSProperties & {
  "--modal-blur"?: string;
  "--modal-dim"?: string;
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  const vars: ModalVars = {
    "--modal-blur": "8px",
    "--modal-dim": "0.15",
  };

  return (
    <div className={styles.modalRoot} style={vars}>
      <div className={styles.modalBg}>
        <LandingPage />
      </div>

      <div className={styles.modalOverlay} />

      <div className={styles.modalContent}>{children}</div>
    </div>
  );
}