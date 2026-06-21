import styles from "./home.module.css";

export default function Home() {
  return (
    <section className={styles.wrap}>
      <h1 className={styles.title}>Developer is Sleeping</h1>
      <p className={styles.sub}>Click Menu for now</p>
    </section>
  );
}
