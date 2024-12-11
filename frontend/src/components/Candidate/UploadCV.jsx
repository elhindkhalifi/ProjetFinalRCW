import styles from "./UploadCV.module.css";

const UploadCV = () => {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    console.log("Uploaded file:", file);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Upload Your CV</h2>
      <input type="file" onChange={handleUpload} className={styles.input} />
    </div>
  );
};

export default UploadCV;
