import styles from "./JobOffers.module.css";

const JobOffers = () => {
  const offers = [
    { id: 1, title: "Frontend Developer", description: "React, Redux" },
    { id: 2, title: "Backend Developer", description: "Node.js, Express" },
  ];

  return (
    <div className={styles.container}>
      {offers.map((offer) => (
        <div key={offer.id} className={styles.offerCard}>
          <h3 className={styles.offerTitle}>{offer.title}</h3>
          <p className={styles.offerDescription}>{offer.description}</p>
        </div>
      ))}
    </div>
  );
};

export default JobOffers;
