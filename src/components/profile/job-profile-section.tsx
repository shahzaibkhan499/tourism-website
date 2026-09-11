"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpRow {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
}

interface EduRow {
  institution: string;
  degree: string;
  year: string;
  field: string;
}

interface JobProfileData {
  headline: string | null;
  summary: string | null;
  skills: string[];
  languages: string[];
  experience: ExpRow[];
  education: EduRow[];
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  expectedSalary: string | null;
  preferredLocations: string[];
  availability: string;
}

const AVAILABILITY_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "LOOKING", label: "Naukri ki talaash" },
  { value: "NOT_LOOKING", label: "فی الحال نہیں" },
];

function toArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function JobProfileSection() {
  const [data, setData] = useState<JobProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [availability, setAvailability] = useState("ACTIVE");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experience, setExperience] = useState<ExpRow[]>([]);
  const [education, setEducation] = useState<EduRow[]>([]);

  const loadProfile = () => {
    setLoading(true);
    fetch("/api/profile/job-profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) return;
        if (json.profile) {
          setData(json.profile as JobProfileData);
          const p = json.profile as JobProfileData;
          setHeadline(p.headline || "");
          setSummary(p.summary || "");
          setSkills((p.skills || []).join(", "));
          setLanguages((p.languages || []).join(", "));
          setExpectedSalary(p.expectedSalary || "");
          setPreferredLocations((p.preferredLocations || []).join(", "));
          setAvailability(p.availability || "ACTIVE");
          setLinkedinUrl(p.linkedinUrl || "");
          setGithubUrl(p.githubUrl || "");
          setPortfolioUrl(p.portfolioUrl || "");
          setExperience(p.experience || []);
          setEducation(p.education || []);
        }
      })
      .catch(() => toast.error("جاب پروفائل لوڈ نہیں ہوئی"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!headline.trim()) {
      toast.error("ہیڈ لائن لکھیں (مثلاً سافٹ ویئر انجینئر)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/job-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          summary: summary.trim() || null,
          skills: toArray(skills),
          languages: toArray(languages),
          experience: experience.filter((e) => e.company.trim() && e.role.trim()),
          education: education.filter((e) => e.institution.trim() && e.degree.trim()),
          resumeUrl: null,
          linkedinUrl: linkedinUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
          portfolioUrl: portfolioUrl.trim() || null,
          expectedSalary: expectedSalary.trim() || null,
          preferredLocations: toArray(preferredLocations),
          availability,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "جاب پروفائل محفوظ نہیں ہوئی");
        return;
      }
      toast.success("جاب پروفائل محفوظ ہو گئی! 🎉");
      setOpen(false);
      setData(json as JobProfileData);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card id="job-profile">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card id="job-profile" className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-amber-600" />
              Job Profile
            </CardTitle>
            <CardDescription>جابز کے لیے آپ کی پیشہ ورانہ پروفائل</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            {data ? "ترمیم کریں" : "بنائیں"}
          </Button>
        </CardHeader>
        {data ? (
          <CardContent className="space-y-4">
            <div>
              <div className="text-base font-semibold text-gray-900">{data.headline}</div>
              {data.summary && <p className="mt-1 text-sm text-gray-600">{data.summary}</p>}
            </div>
            {(data.skills?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {(data.languages?.length ?? 0) > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Languages:</span> {data.languages.join(", ")}
              </div>
            )}
            {(data.experience?.length ?? 0) > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Experience</div>
                <div className="space-y-2">
                  {data.experience.map((e, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="font-medium">
                        {e.role} — {e.company}
                      </div>
                      {(e.startDate || e.endDate) && (
                        <div className="text-xs text-gray-500">
                          {e.startDate || "—"} → {e.endDate || "Present"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(data.education?.length ?? 0) > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Education</div>
                <div className="space-y-2">
                  {data.education.map((e, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="font-medium">
                        {e.degree}
                        {e.field ? ` — ${e.field}` : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {e.institution}
                        {e.year ? ` (${e.year})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              {data.expectedSalary && (
                <span>
                  <span className="font-medium text-gray-800">Expected Salary:</span> {data.expectedSalary}
                </span>
              )}
              {(data.preferredLocations?.length ?? 0) > 0 && (
                <span>
                  <span className="font-medium text-gray-800">Preferred:</span> {data.preferredLocations.join(", ")}
                </span>
              )}
              <span>
                <span className="font-medium text-gray-800">Status:</span> {data.availability}
              </span>
            </div>
            {(data.linkedinUrl || data.githubUrl || data.portfolioUrl) && (
              <div className="flex flex-wrap gap-3">
                {data.linkedinUrl && (
                  <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {data.githubUrl && (
                  <a href={data.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {data.portfolioUrl && (
                  <a href={data.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            )}
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-gray-500">
              ابھی جاب پروفائل نہیں ہے۔ بنائیں تاکہ آپ جابز پر درخواست دے سکیں۔
            </p>
          </CardContent>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Profile {data ? "ترمیم کریں" : "بنائیں"}</DialogTitle>
            <DialogDescription>پیشہ ورانہ تفصیلات بھریں — جابز پر درخواست دینے کے لیے ضروری</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="jp-headline">Headline *</Label>
              <Input id="jp-headline" placeholder="e.g. Software Engineer — React & Node" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jp-summary">Summary</Label>
              <Textarea id="jp-summary" rows={3} placeholder="اپنے بارے میں چند سطریں" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jp-skills">مہارتیں (کوما سے الگ کریں)</Label>
                <Input id="jp-skills" placeholder="React, Node.js, Prisma" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jp-langs">Languages</Label>
                <Input id="jp-langs" placeholder="Urdu, English" value={languages} onChange={(e) => setLanguages(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jp-salary">Expected Salary</Label>
                <Input id="jp-salary" placeholder="e.g. PKR 150,000/month" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jp-locations">Preferred Locations</Label>
                <Input id="jp-locations" placeholder="Karachi, Lahore, Remote" value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="jp-linkedin">LinkedIn URL</Label>
                <Input id="jp-linkedin" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jp-github">GitHub URL</Label>
                <Input id="jp-github" placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jp-portfolio">Portfolio URL</Label>
                <Input id="jp-portfolio" placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Experience</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setExperience([...experience, { company: "", role: "", startDate: "", endDate: "" }])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {experience.length === 0 && <p className="text-xs text-gray-500">ابھی کوئی تجربہ شامل نہیں کیا</p>}
              {experience.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Company" value={e.company} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, company: ev.target.value } : x)))} />
                    <Input placeholder="Role" value={e.role} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, role: ev.target.value } : x)))} />
                    <Input placeholder="Start (e.g. 2020)" value={e.startDate} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, startDate: ev.target.value } : x)))} />
                    <Input placeholder="End (khali = Present)" value={e.endDate} onChange={(ev) => setExperience(experience.map((x, j) => (j === i ? { ...x, endDate: ev.target.value } : x)))} />
                  </div>
                  <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setExperience(experience.filter((_, j) => j !== i))}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Education</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEducation([...education, { institution: "", degree: "", year: "", field: "" }])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {education.length === 0 && <p className="text-xs text-gray-500">ابھی کوئی تعلیم شامل نہیں کی</p>}
              {education.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Institution" value={e.institution} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, institution: ev.target.value } : x)))} />
                    <Input placeholder="Degree" value={e.degree} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, degree: ev.target.value } : x)))} />
                    <Input placeholder="Field (optional)" value={e.field} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, field: ev.target.value } : x)))} />
                    <Input placeholder="Year (e.g. 2022)" value={e.year} onChange={(ev) => setEducation(education.map((x, j) => (j === i ? { ...x, year: ev.target.value } : x)))} />
                  </div>
                  <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => setEducation(education.filter((_, j) => j !== i))}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
