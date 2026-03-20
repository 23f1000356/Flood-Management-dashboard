import Link from 'next/link';
import styles from './header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>🧠 Disaster Prediction Agent</div>
        <nav className={styles.nav}>
          <Link href="/login" className={styles.navLink}>Login</Link>
          <Link href="/facts" className={styles.navLink}>Facts</Link>
          <Link href="/climate-change" className={styles.navLink}>Climate Change</Link>
        </nav>
      </div>
    </header>
  );
}