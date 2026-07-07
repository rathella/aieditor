"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    Promise.all([api.settings.get(), api.settings.getApiKeyStatus()]).then(
      ([settingsRes, keyRes]) => {
        setSettings(settingsRes.settings);
        setCounts(settingsRes.counts);
        setHasApiKey(keyRes.hasKey);
        setLoading(false);
      }
    );
  }, []);

  async function handleSaveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      await api.settings.saveApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setApiKeyInput("");
      toast.success("API key saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the API key.");
    } finally {
      setSavingKey(false);
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle>AI Generation</CardTitle>
          <CardDescription>
            Add an OpenAI API key to generate new drafts in your approved
            articles&apos; style. Needs at least 3 approved articles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${hasApiKey ? "bg-success" : "bg-muted-foreground/40"}`}
            />
            {hasApiKey ? "API key connected" : "No API key set yet"}
          </div>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={hasApiKey ? "sk-••••••••••••••••" : "sk-..."}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <Button onClick={handleSaveApiKey} disabled={savingKey || !apiKeyInput.trim()}>
              {savingKey && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a key at{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              platform.openai.com/api-keys
            </a>
            . Stored securely server-side, never sent back to the browser.
          </p>
        </CardContent>
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
