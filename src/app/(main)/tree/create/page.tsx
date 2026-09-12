"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { T } from "@/lib/i18n";

const formSchema = z.object({
  name: z.string().trim().min(1, "Tree name is required — درخت کا نام لکھنا ضروری ہے").max(120),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PRIVATE", "COLLABORATORS", "CLAN_ONLY", "REGISTERED", "PUBLIC"]),
  includeRoot: z.boolean(),
  rootFirstName: z.string().trim().max(100),
  rootLastName: z.string().trim().max(100),
  rootGender: z.enum(["MALE", "FEMALE"]),
  rootDob: z.string().trim().max(20),
});

type FormValues = z.infer<typeof formSchema>;

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Private", urdu: "نجی — صرف آپ" },
  { value: "COLLABORATORS", label: "Collaborators", urdu: "ساتھی — جنہیں آپ مدعو کریں" },
  { value: "CLAN_ONLY", label: "Clan Only", urdu: "صرف آپ کے کلان کے لوگ" },
  { value: "REGISTERED", label: "Registered", urdu: "تمام رجسٹرڈ صارفین" },
  { value: "PUBLIC", label: "Public", urdu: "عوامی — سب دیکھ سکتے ہیں" },
];

export default function CreateTreePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [treeCount, setTreeCount] = useState<number | null>(null);

  const isFirstTree = treeCount === 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
      includeRoot: true,
      rootFirstName: "",
      rootLastName: "",
      rootGender: "MALE",
      rootDob: "",
    },
  });

  const includeRoot = watch("includeRoot");
  const visibility = watch("visibility");

  // FIX 5: fetch the user's existing tree count — first tree auto-adds the user as root
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tree")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setTreeCount(Array.isArray(j?.items) ? j.items.length : 0);
      })
      .catch(() => {
        if (!cancelled) setTreeCount(1); // fallback: treat as returning user
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          visibility: values.visibility,
          isPublic: values.visibility === "PUBLIC",
          autoAddSelfAsRoot: isFirstTree ? true : values.includeRoot,
          rootMember:
            !isFirstTree && values.includeRoot
              ? {
                  firstName: values.rootFirstName,
                  lastName: values.rootLastName,
                  gender: values.rootGender,
                  dateOfBirth: values.rootDob ? new Date(values.rootDob).toISOString() : null,
                }
              : null,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 400 && j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || T.error.invalidRequest);
        }
        throw new Error(j?.error || T.error.saveFailed);
      }
      toast.success(j?.message || T.tree.treeCreated);
      router.push(`/tree/${j.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : T.common.somethingWentWrong);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={T.tree.createTreeTitle} titleUrdu={T.tree.createTreeSubtitle} />
      <Button variant="ghost" size="sm" className="mb-4 -mt-2" asChild>
        <Link href="/tree">
          <ArrowLeft className="mr-1 h-4 w-4" />
          {T.tree.backToTrees}
        </Link>
      </Button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tree Information — شجرے کی معلومات</CardTitle>
            <CardDescription>Name and privacy for your family tree — اپنے خاندان کے شجرے کا نام اور رازداری کی ترتیب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{T.tree.treeName} *</Label>
              <Input
                id="name"
                placeholder={T.tree.treeNamePlaceholder}
                {...register("name")}
                className={errors.name ? "border-red-400" : ""}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{T.tree.treeDescription}</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder={T.tree.treeDescriptionPlaceholder}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{T.tree.visibility}</Label>
              <Select value={visibility} onValueChange={(v) => setValue("visibility", v as FormValues["visibility"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — {o.urdu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {treeCount === null ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              {T.common.loading}
            </CardContent>
          </Card>
        ) : isFirstTree ? (
          /* FIX 5 — first tree ever: user is auto-added as the root member */
          <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {T.tree.rootMember}
              </CardTitle>
              <CardDescription>{T.tree.youWillBeFirstMember}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {T.tree.youWillBeFirstMember}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{T.tree.rootNote}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{T.tree.rootMember}</CardTitle>
              <CardDescription>The tree root — usually the eldest — شجرے کی جڑ — عموماً سب سے بڑے بزرگ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={includeRoot}
                  onChange={(e) => setValue("includeRoot", e.target.checked)}
                />
                {T.tree.addMeAsRoot}
              </label>

              {includeRoot && (
                <div className="space-y-4 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="rf">{T.profile.firstName}</Label>
                      <Input id="rf" placeholder={T.profile.firstNamePlaceholder} {...register("rootFirstName")} />
                      {errors.rootFirstName && (
                        <p className="text-xs text-red-600">{errors.rootFirstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rl">{T.profile.lastName}</Label>
                      <Input id="rl" placeholder={T.profile.lastNamePlaceholder} {...register("rootLastName")} />
                      {errors.rootLastName && (
                        <p className="text-xs text-red-600">{errors.rootLastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>{T.profile.gender}</Label>
                      <Select value={watch("rootGender")} onValueChange={(v) => setValue("rootGender", v as "MALE" | "FEMALE")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">{T.profile.male}</SelectItem>
                          <SelectItem value="FEMALE">{T.profile.female}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rd">{T.tree.dateOfBirthLabel}</Label>
                      <Input id="rd" type="date" {...register("rootDob")} />
                      {errors.rootDob && <p className="text-xs text-red-600">{errors.rootDob.message}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            {T.common.cancel}
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {saving ? "Creating… — بن رہا ہے…" : T.tree.createTreeBtn}
          </Button>
        </div>
      </form>
    </div>
  );
}
