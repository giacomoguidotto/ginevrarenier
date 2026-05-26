const env =
  process.env.NODE_ENV === "production" ? "production" : "development";

export function cloudinaryFolder(subfolder?: string) {
  const base = `ginevra-renier/${env}`;
  return subfolder ? `${base}/${subfolder}` : base;
}
