export type TranslateFn = (
  text: string,
  from: string,
  to: string
) => Promise<string>;

interface FieldLocale {
  field: string;
  locale: string;
  section: string;
}

export interface AutoTranslateResult {
  failed: { target: FieldLocale; error: unknown }[];
  translated: FieldLocale[];
}

export async function autoTranslateAll(options: {
  markAutoTranslated: (section: string, field: string, locale: string) => void;
  resolveSourceText: (
    section: string,
    field: string,
    targetLocale: string
  ) => { text: string; sourceLocale: string } | undefined;
  staleFields: FieldLocale[];
  translate: TranslateFn;
  writeTranslation: (
    section: string,
    field: string,
    locale: string,
    value: string
  ) => void;
}): Promise<AutoTranslateResult> {
  const translated: FieldLocale[] = [];
  const failed: AutoTranslateResult["failed"] = [];

  for (const target of options.staleFields) {
    const source = options.resolveSourceText(
      target.section,
      target.field,
      target.locale
    );
    if (!source) {
      failed.push({ target, error: new Error("No source text") });
      continue;
    }
    try {
      const result = await options.translate(
        source.text,
        source.sourceLocale,
        target.locale
      );
      options.writeTranslation(
        target.section,
        target.field,
        target.locale,
        result
      );
      options.markAutoTranslated(target.section, target.field, target.locale);
      translated.push(target);
    } catch (error) {
      failed.push({ target, error });
    }
  }

  return { translated, failed };
}
