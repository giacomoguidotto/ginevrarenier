// biome-ignore-all lint/security/noDangerouslySetInnerHtml: static inline script for theme flash prevention — no user input
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("experience-theme");if(t==="dark"||t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches)document.documentElement.classList.add("dark")}catch(e){}})()`,
      }}
    />
  );
}
