import styles from "./rooms.module.css";

// Right-pane content when no room is selected.
export default function RoomsIndex() {
  return (
    <div className={styles.empty}>
      <p>Select a room to start chatting</p>
    </div>
  );
}
