import type { StyleProfile } from "@/types/style-profile";

export class GenerationError extends Error {}

const MODEL = "gpt-4o-mini";

function buildSystemPrompt(
  profile: StyleProfile,
  examples: Array<{ title: string; content: string }>
): string {
  const parts: string[] = [];

  parts.push(
    "You are an encyclopedia editor writing a new article that must match the house style described below as closely as possible. Write in the same language as the example articles."
  );

  if (profile.sourceStatus === "approved-only") {
    parts.push(
      `\nHouse style profile (derived from ${profile.articleCount} approved articles):`,
      `- Average paragraph length: ~${profile.avgParagraphLengthWords} words`,
      `- Average sentence length: ~${profile.avgSentenceLengthWords} words`,
      `- Typical heading structure: ${profile.headingOrderPattern.join(" → ") || "no strict pattern"}`,
      `- Opening style: ${profile.introStructure.description}`,
      `- Tone: ${profile.tone.label} — ${profile.tone.description}`,
      `- Reading level: ${profile.readingComplexity.label} (Flesch ${profile.readingComplexity.fleschScore})`,
      profile.commonVerbs.length
        ? `- Frequently used verbs: ${profile.commonVerbs.slice(0, 8).map((v) => v.word).join(", ")}`
        : "",
      profile.preferredWording.length
        ? `- Preferred vocabulary: ${profile.preferredWording.slice(0, 10).map((v) => v.word).join(", ")}`
        : ""
    );
  }

  if (examples.length > 0) {
    parts.push("\nHere are up to 2 example articles written in the target house style:");
    for (const ex of examples.slice(0, 2)) {
      parts.push(`\n--- Example: "${ex.title}" ---\n${ex.content.slice(0, 2500)}`);
    }
  }

  parts.push(
    "\nOutput format rules:",
    "- Use Markdown with ## for section headings (do not repeat the title as a heading).",
    "- Match the paragraph/sentence length, tone, and heading structure above as closely as possible.",
    "- Do not invent citations, statistics, or quotes. Write only well-established, general knowledge about the topic.",
    "- Do not include a references/sources section.",
    "- Output ONLY the article body in Markdown — no preamble, no explanation."
  );

  return parts.filter(Boolean).join("\n");
}

export async function generateArticle(params: {
  apiKey: string;
  title: string;
  brief?: string;
  profile: StyleProfile;
  examples: Array<{ title: string; content: string }>;
}): Promise<string> {
  const systemPrompt = buildSystemPrompt(params.profile, params.examples);
  const userPrompt = params.brief
    ? `Write an encyclopedia article titled "${params.title}". Additional guidance: ${params.brief}`
    : `Write an encyclopedia article titled "${params.title}".`;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch {
    throw new GenerationError("Couldn't reach the AI provider. Please try again.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data?.error?.message ?? `AI provider returned an error (${response.status}).`;
    if (response.status === 401) {
      throw new GenerationError("That API key was rejected. Please check it in Settings.");
    }
    throw new GenerationError(message);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new GenerationError("The AI provider returned an empty response.");
  }
  return content.trim();
}
