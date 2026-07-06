export type ExportFormatDefault = "json" | "markdown" | "txt";
export type ThemePreference = "light" | "dark" | "system";
export type AiProvider = "openai" | "anthropic" | "google";

export interface ParserSettings {
  stripImages: boolean;
  stripTables: boolean;
  stripReferences: boolean;
  minParagraphWords: number;
  maxArticleTokens: number;
}

export interface AppSettings {
  theme: ThemePreference;
  defaultExportFormat: ExportFormatDefault;
  parser: ParserSettings;
  aiProvider: AiProvider | null; // reserved for future use, always disabled in UI
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  defaultExportFormat: "json",
  parser: {
    stripImages: true,
    stripTables: false,
    stripReferences: true,
    minParagraphWords: 4,
    maxArticleTokens: 20000,
  },
  aiProvider: null,
};
