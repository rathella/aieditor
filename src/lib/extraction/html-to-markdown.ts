import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { CheerioAPI } from "cheerio";

function inline($: CheerioAPI, node: AnyNode): string {
  const $node = $(node);
  let out = "";
  $node.contents().each((_, child) => {
    if (child.type === "text") {
      out += (child.data ?? "").replace(/\s+/g, " ");
      return;
    }
    if (child.type !== "tag") return;

    const tag = child.tagName.toLowerCase();
    const inner = inline($, child);

    switch (tag) {
      case "strong":
      case "b":
        out += inner.trim() ? `**${inner.trim()}**` : "";
        break;
      case "em":
      case "i":
        out += inner.trim() ? `*${inner.trim()}*` : "";
        break;
      case "code":
        out += inner.trim() ? `\`${inner.trim()}\`` : "";
        break;
      case "a": {
        const href = $(child).attr("href") ?? "";
        const label = inner.trim() || href;
        out += href ? `[${label}](${href})` : label;
        break;
      }
      case "br":
        out += "\n";
        break;
      default:
        out += inner;
    }
  });
  return out;
}

function cleanText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/ \n/g, "\n").trim();
}

/**
 * Converts cleaned article HTML into lightweight structured markdown:
 * headings, paragraphs, bold/italic, links, and lists. This is a
 * purpose-built converter (not a full CommonMark implementation) tuned to
 * the shape of encyclopedia article bodies.
 */
export function htmlToMarkdown(html: string): { markdown: string; sectionCount: number } {
  const $ = cheerio.load(`<div id="__root">${html}</div>`);
  const root = $("#__root").get(0)!;

  const lines: string[] = [];
  let sectionCount = 0;

  function walk(el: AnyNode) {
    $(el)
      .children()
      .each((_, child) => {
        if (child.type !== "tag") return;
        const tag = child.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tag)) {
          const level = Number(tag[1]);
          const text = cleanText(inline($, child));
          if (text) {
            lines.push(`${"#".repeat(Math.min(level + 1, 6))} ${text}`, "");
            sectionCount += 1;
          }
          return;
        }

        if (tag === "p") {
          const text = cleanText(inline($, child));
          if (text) lines.push(text, "");
          return;
        }

        if (tag === "blockquote") {
          const text = cleanText(inline($, child));
          if (text) {
            lines.push(
              ...text.split("\n").map((l) => `> ${l}`),
              ""
            );
          }
          return;
        }

        if (tag === "ul" || tag === "ol") {
          $(child)
            .children("li")
            .each((i, li) => {
              const text = cleanText(inline($, li));
              if (!text) return;
              lines.push(tag === "ol" ? `${i + 1}. ${text}` : `- ${text}`);
            });
          lines.push("");
          return;
        }

        if (tag === "figure" || tag === "img") {
          // Images are intentionally dropped: the dataset targets text-only
          // training data. Captions (if any) are preserved as plain text.
          const caption = cleanText($(child).find("figcaption").text());
          if (caption) lines.push(`*${caption}*`, "");
          return;
        }

        if (tag === "table") {
          // Keep tables as a simple readable text block rather than HTML.
          $(child)
            .find("tr")
            .each((_, tr) => {
              const cells = $(tr)
                .find("th,td")
                .toArray()
                .map((cell) => cleanText($(cell).text()));
              if (cells.some(Boolean)) lines.push(cells.join(" | "));
            });
          lines.push("");
          return;
        }

        // Anything else (div, section, article wrappers, etc.) is treated as
        // a transparent container: recurse so nested content isn't lost.
        walk(child);
      });
  }

  walk(root);

  const markdown = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { markdown, sectionCount };
}
