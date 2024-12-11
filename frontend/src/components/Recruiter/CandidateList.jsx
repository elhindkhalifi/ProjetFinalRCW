import styles from "./CandidateList.css";

const CandidateList = () => {
  const candidates = [
    { id: 1, name: "John Doe", skills: ["React", "Node.js"] },
    { id: 2, name: "Jane Smith", skills: ["Python", "Django"] },
  ];

  return (
    <div className={styles.container}>
      {candidates.map((candidate) => (
        <div key={candidate.id} className={styles.candidateCard}>
          <h3 className={styles.candidateName}>{candidate.name}</h3>
          <p className={styles.candidateSkills}>
            Skills: {candidate.skills.join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CandidateList;
