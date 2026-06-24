"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { Award, CheckCircle, Clock, ExternalLink, FileText, Info, Loader2, Lock, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/hooks/useWeb3";

export function ProfileManager() {
  const { jwtToken, userProfile, loadProfile } = useWeb3();

  // Form input states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");
  const [panNo, setPanNo] = useState("");

  // Uploaded document URL states
  const [aadharFrontUrl, setAadharFrontUrl] = useState("");
  const [aadharBackUrl, setAadharBackUrl] = useState("");
  const [panCardUrl, setPanCardUrl] = useState("");

  // Loader states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({
    aadharFront: false,
    aadharBack: false,
    panCard: false,
  });

  // Sync inputs with userProfile once loaded
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setMobile(userProfile.mobile || "");
      setAddress(userProfile.address || "");
      setCity(userProfile.city || "");
      setState(userProfile.state || "");
      setZip(userProfile.zip || "");
      setAadhaarNo(userProfile.aadhaarNo || "");
      setPanNo(userProfile.panNo || "");
      setAadharFrontUrl(userProfile.aadharFrontUrl || "");
      setAadharBackUrl(userProfile.aadharBackUrl || "");
      setPanCardUrl(userProfile.panCardUrl || "");
    }
  }, [userProfile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await fetch("/api/user/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (type === "aadharFront") setAadharFrontUrl(data.url);
        if (type === "aadharBack") setAadharBackUrl(data.url);
        if (type === "panCard") setPanCardUrl(data.url);
        toast.success("Document uploaded successfully!");
      } else {
        toast.error(data.error || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document file.");
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwtToken) return;

    if (!name || !mobile) {
      toast.error("Name and Mobile number are required!");
      return;
    }

    const remaining = userProfile?.profileUpdatesRemaining ?? 3;
    if (remaining <= 0) {
      toast.error("You have no profile updates remaining!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          name,
          mobile,
          address,
          city,
          state,
          zip,
          aadhaarNo,
          panNo,
          aadharFrontUrl,
          aadharBackUrl,
          panCardUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Profile details saved successfully!");
        await loadProfile();
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile details.");
    } finally {
      setLoading(false);
    }
  };

  const remainingUpdates = userProfile?.profileUpdatesRemaining ?? 3;
  const isLocked = remainingUpdates <= 0;
  const rank = userProfile?.rank || "Default";
  const kycStatus = userProfile?.kycStatus || "Unverified";

  const getKycBadge = () => {
    switch (kycStatus) {
      case "Verified":
        return (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-none">
            <CheckCircle className="mr-1 h-3 w-3" /> Verified
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-500 shadow-none">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-none">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-muted-foreground shadow-none">
            Unverified
          </Badge>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* LEFT: Profile Form */}
      <Card className="relative flex flex-col overflow-hidden xl:col-span-8">
        {isLocked && (
          <div className="absolute top-0 right-0 z-10 rounded-bl-xl bg-destructive px-4 py-1.5 font-bold text-[10px] text-destructive-foreground uppercase tracking-wider shadow-sm">
            Locked
          </div>
        )}
        <CardHeader>
          <div className="mb-2 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">Personal</div>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Keep your details updated. You can change your information up to 3 times. Verify your profile for account
            compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          {/* Status Banner */}
          {isLocked ? (
            <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/10 text-destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle className="font-bold text-sm">All updates used!</AlertTitle>
              <AlertDescription className="mt-1 text-xs">
                Your profile settings are now permanently locked for verification. Contact support for assistance.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 border-primary/20 bg-primary/10 text-primary">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-bold text-sm">Updates Available</AlertTitle>
              <AlertDescription className="mt-1 text-xs">
                <strong>Profile Updates: {remainingUpdates} of 3 remaining.</strong> Saving changes will decrease your
                remaining edit attempts.
              </AlertDescription>
            </Alert>
          )}

          <form id="profileForm" onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-name" className="text-muted-foreground text-xs uppercase tracking-wide">
                  Full Name
                </Label>
                <Input
                  id="p-name"
                  type="text"
                  value={name}
                  disabled={isLocked}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full legal name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-mobile" className="text-muted-foreground text-xs uppercase tracking-wide">
                  Mobile Number
                </Label>
                <Input
                  id="p-mobile"
                  type="text"
                  value={mobile}
                  disabled={isLocked}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. +1234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-aadhar-no" className="text-muted-foreground text-xs uppercase tracking-wide">
                  Aadhaar Card Number
                </Label>
                <Input
                  id="p-aadhar-no"
                  type="text"
                  value={aadhaarNo}
                  disabled={isLocked}
                  onChange={(e) => setAadhaarNo(e.target.value)}
                  placeholder="12-digit Aadhaar Number"
                  maxLength={12}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-pan-no" className="text-muted-foreground text-xs uppercase tracking-wide">
                  PAN Card Number
                </Label>
                <Input
                  id="p-pan-no"
                  type="text"
                  value={panNo}
                  disabled={isLocked}
                  onChange={(e) => setPanNo(e.target.value)}
                  placeholder="10-digit PAN Number"
                  maxLength={10}
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-address" className="text-muted-foreground text-xs uppercase tracking-wide">
                Residential Address
              </Label>
              <Input
                id="p-address"
                type="text"
                value={address}
                disabled={isLocked}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street name, house number, apartment, etc."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="p-city" className="text-muted-foreground text-xs uppercase tracking-wide">
                  City
                </Label>
                <Input
                  id="p-city"
                  type="text"
                  value={city}
                  disabled={isLocked}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-state" className="text-muted-foreground text-xs uppercase tracking-wide">
                  State
                </Label>
                <Input
                  id="p-state"
                  type="text"
                  value={state}
                  disabled={isLocked}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-zip" className="text-muted-foreground text-xs uppercase tracking-wide">
                  ZIP / PIN
                </Label>
                <Input
                  id="p-zip"
                  type="text"
                  value={zip}
                  disabled={isLocked}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="ZIP Code"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="mt-auto border-t bg-muted/30 p-6">
          <Button type="submit" form="profileForm" disabled={loading || isLocked} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Save Profile Details
          </Button>
        </CardFooter>
      </Card>

      {/* RIGHT: Rank + Documents */}
      <div className="flex flex-col gap-6 xl:col-span-4">
        {/* Rank Card */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">MLM Status</div>
            <CardDescription className="text-xs">Current Leadership Rank</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="font-black text-3xl text-primary tracking-tight">{rank}</span>
            </div>
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card className="flex-1">
          <CardHeader>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">KYC</div>
              {getKycBadge()}
            </div>
            <CardTitle>Identity Documents</CardTitle>
            <CardDescription>Upload high-quality scans of your KYC credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: "aadharFront",
                label: "Aadhaar Front",
                subtitle: "Front side of card copy",
                url: aadharFrontUrl,
                uploading: uploading.aadharFront,
              },
              {
                key: "aadharBack",
                label: "Aadhaar Back",
                subtitle: "Reverse address side",
                url: aadharBackUrl,
                uploading: uploading.aadharBack,
              },
              {
                key: "panCard",
                label: "PAN Card",
                subtitle: "Front tax identification card",
                url: panCardUrl,
                uploading: uploading.panCard,
              },
            ].map((doc) => (
              <div key={doc.key} className="rounded-xl border bg-muted/40 p-4 transition-colors hover:bg-muted/60">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{doc.label}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{doc.subtitle}</div>
                  </div>
                  {doc.url ? (
                    <Badge
                      variant="default"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" /> Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Empty
                    </Badge>
                  )}
                </div>

                {doc.url && (
                  <div className="group relative mb-3 flex aspect-[1.6/1] items-center justify-center overflow-hidden rounded-lg border bg-black/5">
                    <img src={doc.url} alt={doc.label} className="h-full w-full object-cover" />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 font-medium text-white text-xs opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100"
                    >
                      <ExternalLink className="h-4 w-4" /> View Original
                    </a>
                  </div>
                )}

                <Label
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background py-2.5 font-semibold text-xs shadow-sm transition-all hover:bg-accent hover:text-accent-foreground ${
                    isLocked ? "pointer-events-none cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {doc.uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  {doc.url ? `Replace Document` : `Upload File`}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={isLocked}
                    onChange={(e) => handleFileUpload(e, doc.key)}
                  />
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
