(() => {
  try {
    const t = localStorage.getItem("experience-theme");
    if (
      t === "dark" ||
      (t !== "light" && matchMedia("(prefers-color-scheme:dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // localStorage unavailable
  }
})();
