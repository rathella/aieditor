"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/style-profiles/metric-card";
import { WordFrequencyList } from "@/components/style-profiles/word-frequency-list";
import { api } from "@/lib/api-client";
import type { StyleProfile } from "@/types/style-profile";
import { BookOpen } from "lucide-react";

function StyleProfilesContent() {
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  useEffect(() => {
    api.styleProfile.get().then((res) => setProfile(res.profile));
  }, []);

  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary-800">Style Profiles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate writing patterns extracted from your approved articles —
          used as style guidance for future AI generation.
        </p>
      </div>

      {!profile && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {profile && profile.sourceStatus === "insufficient-data" && (
        <Card className="archive-ruled border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-medium text-primary-800">
              Approve at least 3 articles to unlock a style profile
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              You currently have {profile.articleCount} approved article
              {profile.articleCount === 1 ? "" : "s"}. Style analysis becomes
              meaningful once there&apos;s a real corpus to compare against.
            </p>
          </CardContent>
        </Card>
      )}

      {profile && profile.sourceStatus === "approved-only" && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Approved Articles" value={profile.articleCount} />
            <MetricCard
              label="Avg. Paragraph Length"
              value={`${profile.avgParagraphLengthWords}w`}
            />
            <MetricCard
              label="Avg. Sentence Length"
              value={`${profile.avgSentenceLengthWords}w`}
            />
            <MetricCard label="Avg. Words / Article" value={profile.avgWordsPerArticle} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Heading Order</CardTitle>
                <CardDescription>The most common section structure across articles.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {profile.headingOrderPattern.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No consistent pattern detected.</p>
                ) : (
                  profile.headingOrderPattern.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="secondary">{h}</Badge>
                      {i < profile.headingOrderPattern.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Introduction Structure</CardTitle>
                <CardDescription>How articles typically open.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-primary-800">
                  Average opening paragraph:{" "}
                  <span className="font-semibold">{profile.introStructure.avgIntroWords} words</span>
                </p>
                <p className="text-sm text-muted-foreground">{profile.introStructure.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Writing Tone</CardTitle>
                <CardDescription>{profile.tone.label}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{profile.tone.description}</p>
                <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                  <span>Passive voice: {(profile.tone.passiveVoiceRatio * 100).toFixed(1)}%</span>
                  <span>Modal verbs: {(profile.tone.modalVerbRatio * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reading Complexity</CardTitle>
                <CardDescription>{profile.readingComplexity.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-3xl font-semibold text-primary-800">
                  {profile.readingComplexity.fleschScore}
                </p>
                <p className="text-sm text-muted-foreground">Flesch Reading Ease score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editorial Consistency</CardTitle>
                <CardDescription>{profile.editorialConsistency.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${profile.editorialConsistency.score}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.editorialConsistency.score}% consistent · paragraph length σ={" "}
                  {profile.editorialConsistency.paragraphLengthStdDev}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Verbs</CardTitle>
                <CardDescription>Most frequently used across the corpus.</CardDescription>
              </CardHeader>
              <CardContent>
                <WordFrequencyList items={profile.commonVerbs} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferred Wording</CardTitle>
                <CardDescription>Recurring content words beyond common verbs.</CardDescription>
              </CardHeader>
              <CardContent>
                <WordFrequencyList items={profile.preferredWording} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rarely Used Words</CardTitle>
                <CardDescription>Words that appear exactly once in the corpus.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {profile.rareWords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None detected.</p>
                ) : (
                  profile.rareWords.map((w) => (
                    <Badge key={w} variant="outline">
                      {w}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StyleProfilesPage() {
  return (
    <ProtectedRoute>
      <StyleProfilesContent />
    </ProtectedRoute>
  );
}
