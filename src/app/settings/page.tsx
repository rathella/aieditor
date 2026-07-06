"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/firebase/use-auth";
import { DEFAULT_SETTINGS, type AppSettings } from "@/types/settings";
import { Loader2, Database } from "lucide-react";

function SettingsContent() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [counts, setCounts] = useState<{ total: number; approved: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.get().then((res) => {
      setSettings(res.settings);
      setCounts(res.counts);
      setLoading(false);
    });
  }, []);

  async function persist(next: AppSettings) {
    setSettings(next);
    setSaving(true);
    try {
      await api.settings.save(next);
    } catch {
      toast.error("Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-3xl space-y-6 py-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-primary-800">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.email}. {saving ? "Saving…" : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and default export format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Dark mode is coming soon.</p>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(v) => persist({ ...settings, theme: v as AppSettings["theme"] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Default export format</Label>
            <Select
              value={settings.defaultExportFormat}
              onValueChange={(v) =>
                persist({ ...settings, defaultExportFormat: v as AppSettings["defaultExportFormat"] })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Your workspace data, stored in Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl bg-secondary p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-800">
                {counts?.total ?? 0} articles · {counts?.approved ?? 0} approved
              </p>
              <p className="text-xs text-muted-foreground">Backed by Firebase Firestore</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parser Settings</CardTitle>
          <CardDescription>Controls applied during article extraction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label>Strip images</Label>
            <Switch
              checked={settings.parser.stripImages}
              onCheckedChange={(checked) =>
                persist({ ...settings, parser: { ...settings.parser, stripImages: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Strip tables</Label>
            <Switch
              checked={settings.parser.stripTables}
              onCheckedChange={(checked) =>
                persist({ ...settings, parser: { ...settings.parser, stripTables: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Strip references / citations</Label>
            <Switch
              checked={settings.parser.stripReferences}
              onCheckedChange={(checked) =>
                persist({ ...settings, parser: { ...settings.parser, stripReferences: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Minimum paragraph length (words)</Label>
            <Input
              type="number"
              min={0}
              value={settings.parser.minParagraphWords}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  parser: { ...settings.parser, minParagraphWords: Number(e.target.value) },
                })
              }
              onBlur={() => persist(settings)}
              className="w-24 text-right"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Maximum article tokens</Label>
            <Input
              type="number"
              min={0}
              value={settings.parser.maxArticleTokens}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  parser: { ...settings.parser, maxArticleTokens: Number(e.target.value) },
                })
              }
              onBlur={() => persist(settings)}
              className="w-28 text-right"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="opacity-70">
        <CardHeader>
          <CardTitle>Future AI Provider</CardTitle>
          <CardDescription>
            Connect a provider once AI-assisted features launch. Not active yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select disabled>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Choose a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter>
          <Button disabled variant="outline" size="sm">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Coming soon
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
