export interface WordFrequency {
  word: string;
  count: number;
}

export interface StyleProfile {
  articleCount: number;
  sourceStatus: "approved-only" | "insufficient-data";
  avgParagraphLengthWords: number;
  avgSentenceLengthWords: number;
  avgWordsPerArticle: number;
  headingOrderPattern: string[];
  introStructure: {
    avgIntroWords: number;
    definesSubjectImmediately: boolean;
    description: string;
  };
  tone: {
    label: string;
    passiveVoiceRatio: number;
    modalVerbRatio: number;
    description: string;
  };
  commonVerbs: WordFrequency[];
  preferredWording: WordFrequency[];
  rareWords: string[];
  readingComplexity: {
    fleschScore: number;
    label: string;
  };
  editorialConsistency: {
    score: number; // 0-100
    label: string;
    paragraphLengthStdDev: number;
  };
}
