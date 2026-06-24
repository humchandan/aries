"use client";

import * as React from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ClipboardList,
  Settings,
  LayoutGrid,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Trash2,
  Plus,
  ShieldAlert,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import PortalFactoryArtifact from "../../../../../../public/contracts/PortalFactory.json";
import { AdminUsers } from "./admin-users";

// ─── Sub Components ───────────────────────────────────────────────────────────

function SectionShell({ icon: Icon, title, description, defaultOpen = false, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="overflow-hidden rounded-xl border bg-card">
      <CollapsibleTrigger asChild>
        <button className="group flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors">
          <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180" />
          <Icon className="h-5 w-5 text-zinc-400" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-5 py-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 1. Utility Requests (Organisation) ──────────────────────────────────────
function RequestsSection({ jwtToken }: { jwtToken: string }) {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [actionNotes, setActionNotes] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/utility/requests", { headers: { Authorization: `Bearer ${jwtToken}` } });
    const data = await res.json();
    if (res.ok) setRequests(data.requests || []);
  };

  React.useEffect(() => { load(); }, []);

  const handleAction = async (requestId: number, status: "APPROVED" | "REJECTED") => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/utility/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ requestId, status, adminNotes: actionNotes || `${status} by admin` }),
      });
      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()} successfully.`);
        setSelectedId(null);
        setActionNotes("");
        load();
      } else {
        const d = await res.json();
        toast.error(d.error || "Action failed");
      }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const done = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Pending Requests ({pending.length})
      </div>
      {pending.length === 0 ? (
        <div className="py-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          No pending utility requests
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm">{r.serviceName}</div>
                  <div className="text-xs text-zinc-400">{r.categoryName}</div>
                  <div className="font-mono text-xs text-zinc-500 mt-1">{r.userAddress}</div>
                  <div className="text-xs text-zinc-400 mt-1">Amount: <span className="text-white font-semibold">{Number(r.amount).toFixed(2)} ARES</span></div>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-600 text-xs">PENDING</Badge>
              </div>
              {selectedId === r.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Admin notes (optional)"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction(r.id, "APPROVED")} disabled={loading}>
                      <CheckCircle className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAction(r.id, "REJECTED")} disabled={loading}>
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedId(r.id)}>
                  Review Request
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4">
            Recent Resolved ({done.length})
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {done.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/40 text-xs">
                <div>
                  <span className="text-zinc-300 font-semibold">{r.serviceName}</span>
                  <span className="text-zinc-500 ml-2">{r.userAddress.substring(0, 10)}…</span>
                </div>
                <Badge className={r.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-700" : "bg-red-500/10 text-red-400 border-red-700"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 2. MLM Config (Stack) ────────────────────────────────────────────────────
function MlmConfigSection({ jwtToken }: { jwtToken: string }) {
  const [tiers, setTiers] = React.useState<any[]>([]);
  const [levels, setLevels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editTier, setEditTier] = React.useState<Record<string, any>>({});
  const [editLevel, setEditLevel] = React.useState<Record<string, any>>({});

  const load = async () => {
    const res = await fetch("/api/admin/config", { headers: { Authorization: `Bearer ${jwtToken}` } });
    const data = await res.json();
    if (res.ok) { setTiers(data.tiers || []); setLevels(data.levels || []); }
  };

  React.useEffect(() => { load(); }, []);

  const saveTier = async (tier: any) => {
    setLoading(true);
    try {
      const updates = editTier[tier.id] || {};
      const payload = { type: "tier", id: tier.id, ...tier, ...updates };
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(`Tier '${tier.name}' updated!`); setEditTier(prev => { const n = {...prev}; delete n[tier.id]; return n; }); load(); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const saveLevel = async (lvl: any) => {
    setLoading(true);
    try {
      const updates = editLevel[lvl.id] || {};
      const payload = { type: "level", id: lvl.id, ...lvl, ...updates };
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify(payload) });
      if (res.ok) { toast.success(`Level ${lvl.level} updated!`); setEditLevel(prev => { const n = {...prev}; delete n[lvl.id]; return n; }); load(); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const tierField = (id: number, field: string) => editTier[id]?.[field] ?? tiers.find(t => t.id === id)?.[field] ?? "";
  const lvlField = (id: number, field: string) => editLevel[id]?.[field] ?? levels.find(l => l.id === id)?.[field] ?? "";

  const setTierField = (id: number, field: string, value: string) =>
    setEditTier(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  const setLvlField = (id: number, field: string, value: string) =>
    setEditLevel(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));

  return (
    <div className="space-y-6">
      {/* Tiers */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">MLM Rank Tiers</div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60">
                {["Rank", "Min Stake", "Min Directs", "Min Team Vol", "Unlocked Levels", ""].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
                  <td className="px-3 py-2 font-semibold text-zinc-300 whitespace-nowrap">{tier.name}</td>
                  <td className="px-3 py-2"><Input value={tierField(tier.id, "minSelfInvestment")} onChange={e => setTierField(tier.id, "minSelfInvestment", e.target.value)} className="h-7 text-xs w-28" /></td>
                  <td className="px-3 py-2"><Input value={tierField(tier.id, "minDirects")} onChange={e => setTierField(tier.id, "minDirects", e.target.value)} className="h-7 text-xs w-20" /></td>
                  <td className="px-3 py-2"><Input value={tierField(tier.id, "minTeamVolume")} onChange={e => setTierField(tier.id, "minTeamVolume", e.target.value)} className="h-7 text-xs w-28" /></td>
                  <td className="px-3 py-2"><Input value={tierField(tier.id, "unlockedLevels")} onChange={e => setTierField(tier.id, "unlockedLevels", e.target.value)} className="h-7 text-xs w-20" /></td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => saveTier(tier)} disabled={loading}>
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Levels */}
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Downline Level Bonuses</div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60">
                {["Level", "Bonus %", "Required Rank", ""].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-zinc-500 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {levels.map((lvl) => (
                <tr key={lvl.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
                  <td className="px-3 py-2 font-semibold text-zinc-300">Level {lvl.level}</td>
                  <td className="px-3 py-2"><Input value={lvlField(lvl.id, "bonus")} onChange={e => setLvlField(lvl.id, "bonus", e.target.value)} className="h-7 text-xs w-24" /></td>
                  <td className="px-3 py-2">
                    <select
                      value={lvlField(lvl.id, "requiredRank")}
                      onChange={e => setLvlField(lvl.id, "requiredRank", e.target.value)}
                      className="h-7 rounded-md border border-zinc-700 bg-zinc-900 text-xs px-2 text-zinc-200"
                    >
                      {tiers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => saveLevel(lvl)} disabled={loading}>
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Utility Catalog (Cloud Provider) ─────────────────────────────────────
function CatalogSection({ jwtToken }: { jwtToken: string }) {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCat, setSelectedCat] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatIcon, setNewCatIcon] = React.useState("fa-star");
  const [newSvcName, setNewSvcName] = React.useState("");
  const [newSvcDesc, setNewSvcDesc] = React.useState("");
  const [newSvcMin, setNewSvcMin] = React.useState("1");
  const [newSvcMax, setNewSvcMax] = React.useState("1000");
  const [newSvcFields, setNewSvcFields] = React.useState<any[]>([]);

  const [editSvcId, setEditSvcId] = React.useState<number | null>(null);
  const [editSvcName, setEditSvcName] = React.useState("");
  const [editSvcDesc, setEditSvcDesc] = React.useState("");
  const [editSvcMin, setEditSvcMin] = React.useState("1");
  const [editSvcMax, setEditSvcMax] = React.useState("1000");
  const [editSvcFields, setEditSvcFields] = React.useState<any[]>([]);

  const load = async () => {
    const res = await fetch("/api/admin/utility/categories", { headers: { Authorization: `Bearer ${jwtToken}` } });
    const data = await res.json();
    if (res.ok) {
      const cats = data.categories || [];
      setCategories(cats);
      if (!selectedCat && cats.length > 0) setSelectedCat(cats[0]);
      else if (selectedCat) setSelectedCat(cats.find((c: any) => c.id === selectedCat.id) || cats[0]);
    }
  };

  React.useEffect(() => { load(); }, []);

  const saveCategory = async () => {
    if (!newCatName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/utility/categories", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify({ name: newCatName, icon: newCatIcon }) });
      if (res.ok) { toast.success("Category created!"); setNewCatName(""); load(); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete category and all its services?")) return;
    const res = await fetch(`/api/admin/utility/categories?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${jwtToken}` } });
    if (res.ok) { toast.success("Category deleted!"); load(); }
    else toast.error("Failed to delete");
  };

  const saveService = async () => {
    if (!newSvcName || !newSvcDesc || !selectedCat) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/utility/services", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify({ categoryId: selectedCat.id, name: newSvcName, description: newSvcDesc, minAmount: newSvcMin, maxAmount: newSvcMax, customFields: newSvcFields }) });
      if (res.ok) { toast.success("Service added!"); setNewSvcName(""); setNewSvcDesc(""); setNewSvcFields([]); load(); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const deleteService = async (id: number) => {
    const res = await fetch(`/api/admin/utility/services?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${jwtToken}` } });
    if (res.ok) { toast.success("Service deleted!"); load(); }
    else toast.error("Failed to delete");
  };

  const addField = () => setNewSvcFields([...newSvcFields, { label: "", type: "text", required: true }]);
  const updateField = (idx: number, key: string, val: any) => {
    const f = [...newSvcFields];
    f[idx][key] = val;
    setNewSvcFields(f);
  };
  const removeField = (idx: number) => {
    const f = [...newSvcFields];
    f.splice(idx, 1);
    setNewSvcFields(f);
  };

  const startEditService = (svc: any) => {
    setEditSvcId(svc.id);
    setEditSvcName(svc.name);
    setEditSvcDesc(svc.description);
    setEditSvcMin(svc.minAmount.toString());
    setEditSvcMax(svc.maxAmount.toString());
    try {
      setEditSvcFields(typeof svc.customFields === 'string' ? JSON.parse(svc.customFields) : (svc.customFields || []));
    } catch {
      setEditSvcFields([]);
    }
  };

  const updateService = async () => {
    if (!editSvcName || !editSvcDesc || !editSvcId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/utility/services", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify({ id: editSvcId, name: editSvcName, description: editSvcDesc, minAmount: editSvcMin, maxAmount: editSvcMax, customFields: editSvcFields }) });
      if (res.ok) { toast.success("Service updated!"); setEditSvcId(null); load(); }
      else { const d = await res.json(); toast.error(d.error || "Failed"); }
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const addEditField = () => setEditSvcFields([...editSvcFields, { label: "", type: "text", required: true }]);
  const updateEditField = (idx: number, key: string, val: any) => {
    const f = [...editSvcFields];
    f[idx][key] = val;
    setEditSvcFields(f);
  };
  const removeEditField = (idx: number) => {
    const f = [...editSvcFields];
    f.splice(idx, 1);
    setEditSvcFields(f);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Categories */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categories</div>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedCat?.id === cat.id ? "border-zinc-600 bg-zinc-800/60" : "border-zinc-800/50 hover:border-zinc-700"}`}
              onClick={() => setSelectedCat(cat)}>
              <div className="text-sm font-medium">{cat.name}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{cat.services?.length || 0} services</Badge>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400" onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name" className="text-xs h-8" />
          <Button size="sm" className="h-8 gap-1" onClick={saveCategory} disabled={loading}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </div>

      {/* Services under selected category */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Services {selectedCat ? `— ${selectedCat.name}` : ""}
        </div>
        {!selectedCat ? (
          <div className="py-6 text-center text-sm text-zinc-500">Select a category</div>
        ) : (
          <>
            <div className="space-y-2">
              {(selectedCat.services || []).map((svc: any) => (
                editSvcId === svc.id ? (
                  <div key={svc.id} className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-700/60 space-y-2">
                    <Select value={editSvcName} onValueChange={setEditSvcName}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select Service Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Mobile Recharge", "Electricity Bill", "Water Bill", "DTH / Cable TV", "Broadband / Landline", "Gas Pipeline", "Gas Cylinder", "Fastag", "Municipal Taxes", "Loan Repayment", "Credit Card", "Insurance Premium"].map(svc => (
                          <SelectItem key={svc} value={svc}>{svc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={editSvcDesc} onChange={e => setEditSvcDesc(e.target.value)} placeholder="Description" className="text-xs h-8" />
                    <div className="flex gap-2">
                      <Input value={editSvcMin} onChange={e => setEditSvcMin(e.target.value)} placeholder="Min ARES" className="text-xs h-8" />
                      <Input value={editSvcMax} onChange={e => setEditSvcMax(e.target.value)} placeholder="Max ARES" className="text-xs h-8" />
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase">Custom Fields</div>
                        <Button size="sm" variant="ghost" onClick={addEditField} className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1" /> Field</Button>
                      </div>
                      {editSvcFields.map((f, idx) => (
                        <div key={idx} className="flex flex-col gap-2 bg-zinc-950/40 p-2 rounded border border-zinc-800/40">
                          <div className="flex gap-2 items-center">
                            <Input value={f.label} onChange={e => updateEditField(idx, 'label', e.target.value)} placeholder="Field Label" className="text-xs h-7 flex-1" />
                            <select value={f.type} onChange={e => updateEditField(idx, 'type', e.target.value)} className="h-7 text-xs bg-zinc-900 border border-zinc-700 rounded px-1 text-zinc-300">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="file">Image Upload</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                            <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <input type="checkbox" checked={f.required} onChange={e => updateEditField(idx, 'required', e.target.checked)} /> Req
                            </label>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400" onClick={() => removeEditField(idx)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          {f.type === 'dropdown' && (
                            <Input value={f.options || ""} onChange={e => updateEditField(idx, 'options', e.target.value)} placeholder="Comma-separated options (e.g. Prepaid, Postpaid)" className="text-xs h-7 w-full" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="w-full gap-1" onClick={updateService} disabled={loading}>
                        <Save className="w-3 h-3" /> Save Changes
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => setEditSvcId(null)} disabled={loading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={svc.id} className="flex items-start justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/40 hover:border-zinc-700/50 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{svc.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{svc.description}</div>
                      <div className="text-xs text-zinc-600 mt-1">{Number(svc.minAmount).toFixed(0)}–{Number(svc.maxAmount).toFixed(0)} ARES</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-400 hover:text-primary" onClick={() => startEditService(svc)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400" onClick={() => deleteService(svc.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Select value={newSvcName} onValueChange={setNewSvcName}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Select Service Name" />
                </SelectTrigger>
                <SelectContent>
                  {["Mobile Recharge", "Electricity Bill", "Water Bill", "DTH / Cable TV", "Broadband / Landline", "Gas Pipeline", "Gas Cylinder", "Fastag", "Municipal Taxes", "Loan Repayment", "Credit Card", "Insurance Premium"].map(svc => (
                    <SelectItem key={svc} value={svc}>{svc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={newSvcDesc} onChange={e => setNewSvcDesc(e.target.value)} placeholder="Description" className="text-xs h-8" />
              <div className="flex gap-2">
                <Input value={newSvcMin} onChange={e => setNewSvcMin(e.target.value)} placeholder="Min ARES" className="text-xs h-8" />
                <Input value={newSvcMax} onChange={e => setNewSvcMax(e.target.value)} placeholder="Max ARES" className="text-xs h-8" />
              </div>
              
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">Custom Form Fields (User Inputs)</div>
                  <Button size="sm" variant="ghost" onClick={addField} className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1" /> Field</Button>
                </div>
                {newSvcFields.map((f, idx) => (
                  <div key={idx} className="flex flex-col gap-2 bg-zinc-950/40 p-2 rounded border border-zinc-800/40">
                    <div className="flex gap-2 items-center">
                      <Input value={f.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="Field Label (e.g. Phone No)" className="text-xs h-7 flex-1" />
                      <select value={f.type} onChange={e => updateField(idx, 'type', e.target.value)} className="h-7 text-xs bg-zinc-900 border border-zinc-700 rounded px-1 text-zinc-300">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="file">Image Upload</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                      <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <input type="checkbox" checked={f.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                        Req
                      </label>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400" onClick={() => removeField(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {f.type === 'dropdown' && (
                      <Input value={f.options || ""} onChange={e => updateField(idx, 'options', e.target.value)} placeholder="Comma-separated options (e.g. Prepaid, Postpaid)" className="text-xs h-7 w-full" />
                    )}
                  </div>
                ))}
              </div>

              <Button size="sm" className="gap-1 w-full mt-2" onClick={saveService} disabled={loading}>
                <Plus className="w-3 h-3" /> Add Service
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 4. Blockchain Config (Project Type) ─────────────────────────────────────
function BlockchainSection({ jwtToken, provider }: { jwtToken: string; provider: any }) {
  const [portalAddress, setPortalAddress] = React.useState("");
  const [contractSigner, setContractSigner] = React.useState("Loading…");
  const [feeRecipient, setFeeRecipient] = React.useState("Loading…");
  const [owner, setOwner] = React.useState("Loading…");
  const [balance, setBalance] = React.useState("0");
  const [newSigner, setNewSigner] = React.useState("");
  const [newFee, setNewFee] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/contracts/AriesSupportPortal.json");
        const json = await res.json();
        setPortalAddress(json.address);
        if (provider) {
          const contract = new ethers.Contract(json.address, json.abi, provider);
          const [sig, fee, own] = await Promise.all([contract.trustedSigner(), contract.feeRecipient(), contract.owner()]);
          const bal = await provider.getBalance(json.address);
          setContractSigner(sig);
          setFeeRecipient(fee);
          setOwner(own);
          setBalance(ethers.formatEther(bal));
        }
      } catch (e) { console.error(e); }
    })();
  }, [provider]);

  const getContractWithSigner = async () => {
    const res = await fetch("/contracts/AriesSupportPortal.json");
    const json = await res.json();
    const web3Signer = await provider.getSigner();
    return new ethers.Contract(json.address, json.abi, web3Signer);
  };

  const handleSetSigner = async () => {
    if (!ethers.isAddress(newSigner)) { toast.error("Invalid address"); return; }
    setLoading(true);
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.setSignerAddress(newSigner);
      toast.info("Tx submitted: " + tx.hash.substring(0, 12) + "…");
      await tx.wait();
      toast.success("Signer address updated on-chain!");
      setNewSigner("");
    } catch (e: any) { toast.error(e.reason || e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleSetFeeRecipient = async () => {
    if (!ethers.isAddress(newFee)) { toast.error("Invalid address"); return; }
    setLoading(true);
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.setFeeRecipient(newFee);
      toast.info("Tx submitted: " + tx.hash.substring(0, 12) + "…");
      await tx.wait();
      toast.success("Fee recipient updated on-chain!");
      setNewFee("");
    } catch (e: any) { toast.error(e.reason || e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const row = (label: string, value: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-zinc-800/40">
      <span className="text-xs font-semibold text-zinc-500 w-36 shrink-0 uppercase">{label}</span>
      <span className="font-mono text-xs text-zinc-200 break-all">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 p-4 space-y-1">
        {row("Portal Address", portalAddress || "Loading…")}
        {row("Trusted Signer", contractSigner)}
        {row("Fee Recipient", feeRecipient)}
        {row("Owner", owner)}
        {row("Contract Balance", balance + " ARES")}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-400 uppercase">Update Signer</div>
          <Input value={newSigner} onChange={e => setNewSigner(e.target.value)} placeholder="0x…" className="text-xs" />
          <Button size="sm" className="w-full gap-1" onClick={handleSetSigner} disabled={loading || !provider}>
            <Save className="w-3 h-3" /> Set Signer On-Chain
          </Button>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-400 uppercase">Update Fee Recipient</div>
          <Input value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="0x…" className="text-xs" />
          <Button size="sm" className="w-full gap-1" onClick={handleSetFeeRecipient} disabled={loading || !provider}>
            <Save className="w-3 h-3" /> Set Fee Recipient On-Chain
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Live Event Media (Environment) ───────────────────────────────────────
function MediaSection({ jwtToken }: { jwtToken: string }) {
  const [media, setMedia] = React.useState<any[]>([]);
  const [type, setType] = React.useState<"IMAGE" | "VIDEO">("IMAGE");
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/utility/media");
    const data = await res.json();
    if (res.ok) setMedia(data.media || []);
  };

  React.useEffect(() => { load(); }, []);

  const publish = async () => {
    if (!url || !title) { toast.error("Title and URL are required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/utility/media", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` }, body: JSON.stringify({ type, url, title, caption }) });
      const data = await res.json();
      if (res.ok && data.success) { toast.success("Media published!"); setUrl(""); setTitle(""); setCaption(""); load(); }
      else toast.error(data.error || "Failed to publish");
    } catch { toast.error("Server error"); }
    finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/admin/utility/media?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${jwtToken}` } });
    if (res.ok) { toast.success("Media removed!"); load(); }
    else toast.error("Failed to delete");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Publish New Media</div>
          <div className="flex gap-2">
            {(["IMAGE", "VIDEO"] as const).map(t => (
              <Button key={t} size="sm" variant={type === t ? "default" : "outline"} onClick={() => setType(t)} className="text-xs">{t}</Button>
            ))}
          </div>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Media URL" className="text-xs" />
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="text-xs" />
          <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className="text-xs" />
          <Button size="sm" className="w-full gap-1" onClick={publish} disabled={loading}>
            <Plus className="w-3 h-3" /> Publish Media
          </Button>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Published ({media.length})</div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {media.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-xl">No media published yet</div>
            ) : media.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/40">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate">{m.title}</div>
                    <div className="text-[10px] text-zinc-500">{m.type}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400 shrink-0" onClick={() => remove(m.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { userAddress, jwtToken, provider } = useWeb3();
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkAdmin() {
      if (!userAddress || !provider) {
        setIsAdmin(false);
        return;
      }
      try {
        const contract = new ethers.Contract(
          PortalFactoryArtifact.address,
          PortalFactoryArtifact.abi,
          provider
        );
        const owner = await contract.owner();
        setIsAdmin(owner.toLowerCase() === userAddress.toLowerCase());
      } catch (err) {
        console.error("Failed to check owner:", err);
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [userAddress, provider]);

  if (!jwtToken || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500 mb-4" />
        <p className="text-zinc-400">Waiting for wallet connection and authorization…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-md mx-auto">
        <ShieldAlert className="w-14 h-14 text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Access Denied</h3>
        <p className="text-zinc-500 text-sm mb-2">You are connected as:</p>
        <p className="font-mono text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 mb-4 break-all">{userAddress}</p>
        <p className="text-zinc-600 text-xs">Only the authorized master custodian address may access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage platform configuration, MLM rules, utility catalog, and live media</p>
      </div>

      {/* Section 1 — Organisation → Utility Requests */}
      <SectionShell icon={ClipboardList} title="Utility Requests" description="Review and approve/reject pending utility service requests" defaultOpen>
        <RequestsSection jwtToken={jwtToken} />
      </SectionShell>

      {/* Section 2 — Stack → MLM Config */}
      <SectionShell icon={Settings} title="MLM Config Rules" description="Configure rank tier thresholds and downline level bonus percentages">
        <MlmConfigSection jwtToken={jwtToken} />
      </SectionShell>

      {/* Section 3 — Cloud Provider → Utility Catalog */}
      <SectionShell icon={LayoutGrid} title="Utility Services Catalog" description="Manage utility service categories and the services offered within each">
        <CatalogSection jwtToken={jwtToken} />
      </SectionShell>

      {/* Section 4 — Project Type → Blockchain Config */}
      <SectionShell icon={LinkIcon} title="Blockchain Configuration" description="View and update on-chain contract addresses, signer, and fee recipient">
        <BlockchainSection jwtToken={jwtToken} provider={provider} />
      </SectionShell>

      {/* Section 5 — Environment → Live Event Media */}
      <SectionShell icon={ImageIcon} title="Live Event Media" description="Publish images and videos shown on the platform's live events section">
        <MediaSection jwtToken={jwtToken} />
      </SectionShell>

      {/* Section 6 — User Management */}
      <SectionShell icon={ShieldAlert} title="User Management" description="Manage all system users and bans" defaultOpen={false}>
        <AdminUsers />
      </SectionShell>
    </div>
  );
}
