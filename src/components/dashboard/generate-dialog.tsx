"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

export function GenerateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    if (!title.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const { article } = await api.generate.create(title.trim(), brief.trim() || undefined);
      toast.success("Draft generated", {
        description: "Review it, then approve when you're happy with it.",
      });
      setOpen(false);
      router.push(`/analyze/${article.id}`);
    } catch (err) {
      toast.error("Couldn't generate that article", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="lg" className="h-14 rounded-xl px-7">
          <Sparkles className="h-4 w-4" />
          Generate from Style
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate a new draft</DialogTitle>
          <DialogDescription>
            Writes a new article in the voice of your approved articles.
            Needs at least 3 approved articles and an OpenAI key in Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="gen-title">Title</Label>
            <Input
              id="gen-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ottoman Tile Making"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gen-brief">Extra guidance (optional)</Label>
            <Textarea
              id="gen-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Anything specific to cover or emphasize…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading || !title.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
