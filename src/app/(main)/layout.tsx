import type { ReactNode } from "react";
import landing from "../landing.module.css";
import styles from "./mainLayout.module.css";

import { LandingHeader } from "../../components/layout/LandingHeader";
import { LandingFooter } from "../../components/layout/LandingFooter";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${landing.page} ${styles.shell}`}>
      <LandingHeader />
      <main className={styles.main}>{children}</main>
      <LandingFooter />
    </div>
  );
}