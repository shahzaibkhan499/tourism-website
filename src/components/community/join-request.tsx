"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubClanItem } from "@/types";

interface JoinRequestProps {
  clanId: string;
  clanName: string;
  subClans: SubClanItem[];
}

export function JoinRequest({ clanId, clanName, subClans }: JoinRequestProps) {
  const [open, setOpen] = useState(false);
  const [subClanId, setSubClanId] = useState("");
  const [otherName, setOtherName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clanId,
          subClanId: subClanId === "other" ? null : subClanId || null,
          subClanName: subClanId === "other" ? otherName : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "درخواست نہیں بھیجی جا سکی");
        return;
      }
      toast.success("شمولیت کی درخواست بھیج دی گئی! منظوری کے بعد آپ ممبر بن جائیں گے۔");
      setOpen(false);
      setSubClanId("");
      setOtherName("");
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="mr-1 h-4 w-4" />
          Join Clan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{clanName} کلان جوائن کریں</DialogTitle>
          <DialogDescription>
            اپنا ذیلی کلان منتخب کریں۔ منظوری ایڈمن یا ماڈریٹر دے گا۔
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sub-Clan</Label>
            <Select value={subClanId} onValueChange={setSubClanId}>
              <SelectTrigger>
                <SelectValue placeholder="سب کلان منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {subClans.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other (naam likhein)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {subClanId === "other" && (
            <div className="space-y-1.5">
              <Label htmlFor="other-subclan">نئے ذیلی کلان کا نام</Label>
              <Input
                id="other-subclan"
                placeholder="e.g. Karachi Branch"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Request Bhejein
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
