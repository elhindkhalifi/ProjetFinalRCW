import styles from "./SearchBar.module.css";

const SearchBar = ({ onSearch }) => {
  const handleSearch = (e) => {
    onSearch(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="Search..."
      onChange={handleSearch}
      className={styles.input}
    />
  );
};

export default SearchBar;
