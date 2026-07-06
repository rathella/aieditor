export const STOPWORDS = new Set(
  `a an the and or but nor so yet for of to in on at by with from into onto
   over under again further then once here there when where why how all any
   both each few more most other some such no not only own same than too very
   s t can will just don should now is are was were be been being have has had
   do does did doing this that these those i me my myself we our ours ourselves
   you your yours yourself yourselves he him his himself she her hers herself
   it its itself they them their theirs themselves what which who whom as if
   about against between during before after above below up down out off
   also which its it's within while per than because since until unless
   however therefore thus among throughout upon towards toward whose whom`
    .split(/\s+/)
    .filter(Boolean)
);

// A curated list of common, high-frequency verbs to look for in encyclopedia
// prose. This is intentionally a fixed lexicon rather than a POS tagger —
// good enough to surface editorial verb preferences without adding an NLP
// dependency to the stack.
export const VERB_LEXICON = new Set(
  `is are was were be been being has have had become became include includes
   included serve serves served provide provides provided describe describes
   described develop develops developed establish establishes established
   create creates created use uses used form forms formed consist consists
   consisted refer refers referred represent represents represented contain
   contains contained produce produces produced result results resulted lead
   leads led allow allows allowed require requires required involve involves
   involved occur occurs occurred remain remains remained continue continues
   continued begin begins began publish publishes published introduce
   introduces introduced known knows know made make makes derive derives
   derived name names named call calls called found founded write writes
   wrote written build builds built appear appears appeared consider
   considers considered gave give gives grow grows grew located locate
   locates situated live lives lived died die dies death born born work
   works worked live lives lived`
    .split(/\s+/)
    .filter(Boolean)
);

export function splitIntoParagraphs(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#") && !b.startsWith(">") && !b.startsWith("|"));
}

export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z']+/g);
  return matches ?? [];
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

export function wordFrequency(words: string[], filter?: (w: string) => boolean): Map<string, number> {
  const freq = new Map<string, number>();
  for (const w of words) {
    if (filter && !filter(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return freq;
}

export function topEntries(freq: Map<string, number>, n: number): { word: string; count: number }[] {
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }));
}
