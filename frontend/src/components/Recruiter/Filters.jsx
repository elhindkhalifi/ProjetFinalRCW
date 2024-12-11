import styles from "./Filters.module.css";

const Filters = () => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Experience:</label>
      <select className={styles.select}>
        <option value="all">All</option>
        <option value="junior">Junior</option>
        <option value="senior">Senior</option>
      </select>
    </div>
  );
};

export default Filters;
