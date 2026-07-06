"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

export function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const { article } = await api.articles.create(url.trim());
      if (article.status === "failed") {
        toast.error("Extraction produced too little usable content.", {
          description: "Try a different article, or open it to inspect what was found.",
        });
      } else {
        toast.success("Article analyzed", {
          description: `${article.wordCount.toLocaleString()} words extracted at ${article.extractionQuality}% quality.`,
        });
      }
      router.push(`/analyze/${article.id}`);
    } catch (err) {
      toast.error("Couldn't analyze that URL", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="archive-ruled pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800">
            <Sparkles className="h-3.5 w-3.5" />
            Dataset preparation, not article generation
          </div>

          <h1 className="gold-rule mx-auto inline-block text-balance text-4xl font-semibold leading-[1.15] text-primary-800 md:text-[2.75rem]">
            Kure Dataset Builder
          </h1>

          <p className="mx-auto mt-8 max-w-lg text-balance text-[1.05rem] leading-relaxed text-muted-foreground">
            Build clean, structured datasets from encyclopedia articles for AI
            training.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-9 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              inputMode="url"
              className="h-14 flex-1 rounded-xl px-5 text-base shadow-panel"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !url.trim()}
              className="h-14 rounded-xl px-7"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze Article
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Works best with public, article-style encyclopedia pages.
          </p>
        </div>
      </div>
    </section>
  );
}
