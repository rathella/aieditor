import type { StyleProfile, WordFrequency } from "@/types/style-profile";
import {
  STOPWORDS,
  VERB_LEXICON,
  splitIntoParagraphs,
  splitIntoSentences,
  tokenizeWords,
  countSyllables,
  mean,
  stdDev,
  wordFrequency,
  topEntries,
} from "./text-stats";

const EMPTY_PROFILE: StyleProfile = {
  articleCount: 0,
  sourceStatus: "insufficient-data",
  avgParagraphLengthWords: 0,
  avgSentenceLengthWords: 0,
  avgWordsPerArticle: 0,
  headingOrderPattern: [],
  introStructure: {
    avgIntroWords: 0,
    definesSubjectImmediately: false,
    description: "Approve at least 3 articles to generate a style profile.",
  },
  tone: {
    label: "—",
    passiveVoiceRatio: 0,
    modalVerbRatio: 0,
    description: "Not enough approved articles yet.",
  },
  commonVerbs: [],
  preferredWording: [],
  rareWords: [],
  readingComplexity: { fleschScore: 0, label: "—" },
  editorialConsistency: { score: 0, label: "—", paragraphLengthStdDev: 0 },
};

const MIN_ARTICLES_FOR_PROFILE = 3;

function extractHeadingLevels(markdown: string): number[] {
  const matches = markdown.match(/^#{2,6}\s+.+$/gm) ?? [];
  return matches.map((line) => (line.match(/^#+/) ?? ["##"])[0].length);
}

function modalHeadingPattern(allLevels: number[][]): string[] {
  if (allLevels.length === 0) return [];
  const modalLength = Math.round(mean(allLevels.map((l) => l.length))) || 0;
  const pattern: string[] = [];
  for (let i = 0; i < modalLength; i++) {
    const valuesAtIndex = allLevels
      .filter((l) => l.length > i)
      .map((l) => l[i]!);
    if (valuesAtIndex.length === 0) break;
    const counts = new Map<number, number>();
    for (const v of valuesAtIndex) counts.set(v, (counts.get(v) ?? 0) + 1);
    const modal = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]![0];
    pattern.push(`H${modal}`);
  }
  return pattern;
}

function toneFromRatios(passiveRatio: number, modalRatio: number, avgSentenceLen: number): {
  label: string;
  description: string;
} {
  if (passiveRatio > 0.18 && avgSentenceLen > 20) {
    return {
      label: "Formal / Academic",
      description:
        "Frequent passive constructions and longer sentences suggest a formal, reference-book register.",
    };
  }
  if (modalRatio > 0.02) {
    return {
      label: "Explanatory / Qualified",
      description:
        "Regular use of modal verbs (may, can, is likely to) suggests a careful, qualified explanatory tone.",
    };
  }
  if (avgSentenceLen < 15) {
    return {
      label: "Direct / Concise",
      description: "Short average sentence length suggests a plain, direct editorial voice.",
    };
  }
  return {
    label: "Neutral / Descriptive",
    description: "Balanced sentence length and voice usage typical of general reference writing.",
  };
}

function fleschLabel(score: number): string {
  if (score >= 70) return "Easy to read";
  if (score >= 50) return "Standard";
  if (score >= 30) return "Fairly difficult";
  return "Difficult / technical";
}

function consistencyLabel(score: number): string {
  if (score >= 80) return "Highly consistent";
  if (score >= 60) return "Consistent";
  if (score >= 40) return "Somewhat variable";
  return "Highly variable";
}

/**
 * Computes aggregate writing-style metrics across the corpus of *approved*
 * articles. Pure analysis — this never rewrites or scores individual
 * articles' "quality", it only describes patterns for later use as AI style
 * guidance.
 */
export function computeStyleProfile(
  articles: Array<{ title: string; content: string }>
): StyleProfile {
  if (articles.length < MIN_ARTICLES_FOR_PROFILE) {
    return { ...EMPTY_PROFILE, articleCount: articles.length };
  }

  const allParagraphs: string[] = [];
  const allSentences: string[] = [];
  const allWords: string[] = [];
  const headingLevelsPerArticle: number[][] = [];
  const wordsPerArticle: number[] = [];
  const introWordCounts: number[] = [];
  let subjectDefiningIntros = 0;

  for (const article of articles) {
    const paragraphs = splitIntoParagraphs(article.content);
    allParagraphs.push(...paragraphs);

    const words = tokenizeWords(article.content);
    allWords.push(...words);
    wordsPerArticle.push(words.length);

    for (const p of paragraphs) {
      allSentences.push(...splitIntoSentences(p));
    }

    headingLevelsPerArticle.push(extractHeadingLevels(article.content));

    const intro = paragraphs[0] ?? "";
    const introWords = tokenizeWords(intro);
    introWordCounts.push(introWords.length);

    const first15 = introWords.slice(0, 15).join(" ");
    if (/\b(is|was|are|were|refers?|means?)\b/.test(first15)) {
      subjectDefiningIntros += 1;
    }
  }

  const paragraphWordCounts = allParagraphs.map((p) => tokenizeWords(p).length);
  const sentenceWordCounts = allSentences.map((s) => tokenizeWords(s).length);

  const totalWords = allWords.length;
  const totalSyllables = allWords.reduce((sum, w) => sum + countSyllables(w), 0);
  const fleschScore =
    allSentences.length > 0 && totalWords > 0
      ? 206.835 -
        1.015 * (totalWords / allSentences.length) -
        84.6 * (totalSyllables / totalWords)
      : 0;

  const passiveMatches =
    articles
      .map((a) => a.content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi)?.length ?? 0)
      .reduce((a, b) => a + b, 0) || 0;
  const passiveVoiceRatio = allSentences.length > 0 ? passiveMatches / allSentences.length : 0;

  const modalMatches = allWords.filter((w) =>
    ["can", "could", "may", "might", "must", "shall", "should", "will", "would"].includes(w)
  ).length;
  const modalVerbRatio = totalWords > 0 ? modalMatches / totalWords : 0;

  const avgSentenceLengthWords = mean(sentenceWordCounts);
  const tone = toneFromRatios(passiveVoiceRatio, modalVerbRatio, avgSentenceLengthWords);

  const verbFreq = wordFrequency(allWords, (w) => VERB_LEXICON.has(w));
  const contentWordFreq = wordFrequency(
    allWords,
    (w) => w.length > 3 && !STOPWORDS.has(w) && !VERB_LEXICON.has(w)
  );

  const allFreq = wordFrequency(allWords);
  const rareWords = Array.from(allFreq.entries())
    .filter(([w, c]) => c === 1 && w.length > 6 && !STOPWORDS.has(w))
    .map(([w]) => w)
    .slice(0, 20);

  const paragraphStdDev = stdDev(paragraphWordCounts);
  const paragraphMean = mean(paragraphWordCounts) || 1;
  const consistencyScore = Math.max(
    0,
    Math.min(100, Math.round(100 - (paragraphStdDev / paragraphMean) * 100))
  );

  const profile: StyleProfile = {
    articleCount: articles.length,
    sourceStatus: "approved-only",
    avgParagraphLengthWords: Math.round(mean(paragraphWordCounts)),
    avgSentenceLengthWords: Math.round(avgSentenceLengthWords),
    avgWordsPerArticle: Math.round(mean(wordsPerArticle)),
    headingOrderPattern: modalHeadingPattern(headingLevelsPerArticle),
    introStructure: {
      avgIntroWords: Math.round(mean(introWordCounts)),
      definesSubjectImmediately: subjectDefiningIntros / articles.length > 0.5,
      description:
        subjectDefiningIntros / articles.length > 0.5
          ? "Most articles define the subject in the opening sentence (e.g. \u201cX is a...\u201d)."
          : "Articles vary in how directly they open — no single dominant opening pattern.",
    },
    tone: {
      label: tone.label,
      passiveVoiceRatio: Math.round(passiveVoiceRatio * 1000) / 1000,
      modalVerbRatio: Math.round(modalVerbRatio * 1000) / 1000,
      description: tone.description,
    },
    commonVerbs: topEntries(verbFreq, 12) as WordFrequency[],
    preferredWording: topEntries(contentWordFreq, 15) as WordFrequency[],
    rareWords,
    readingComplexity: {
      fleschScore: Math.round(fleschScore * 10) / 10,
      label: fleschLabel(fleschScore),
    },
    editorialConsistency: {
      score: consistencyScore,
      label: consistencyLabel(consistencyScore),
      paragraphLengthStdDev: Math.round(paragraphStdDev * 10) / 10,
    },
  };

  return profile;
}
