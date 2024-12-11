export const login = (email, password) => {
  if (email === "recruiter@example.com") return "recruiter";
  if (email === "candidate@example.com") return "candidate";
  return null;
};
