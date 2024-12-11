import styles from "./GenerateCoverLetter.css";

const GenerateCoverLetter = () => {
  const handleGenerate = () => {
    alert("Cover letter generated!");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Generate Cover Letter</h2>
      <button onClick={handleGenerate} className={styles.button}>
        Generate
      </button>
    </div>
  );
};

export default GenerateCoverLetter;
