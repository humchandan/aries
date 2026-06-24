"use client";

import { useEffect, useState } from "react";
import { CreditCard, Edit, Flame, Landmark, Loader2, Plus, Smartphone, Trash, Zap } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWeb3 } from "@/hooks/useWeb3";

// Icon mapping helper
const getIcon = (iconStr: string) => {
  if (iconStr.includes('mobile') || iconStr.includes('phone')) return <Smartphone className="h-6 w-6" />;
  if (iconStr.includes('bolt') || iconStr.includes('zap') || iconStr.toLowerCase().includes('electricity')) return <Zap className="h-6 w-6" />;
  if (iconStr.includes('fire') || iconStr.includes('flame') || iconStr.toLowerCase().includes('gas')) return <Flame className="h-6 w-6" />;
  if (iconStr.includes('building') || iconStr.includes('landmark')) return <Landmark className="h-6 w-6" />;
  return <Zap className="h-6 w-6" />; // Default
};

export default function UtilityPortalPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [billers, setBillers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Form State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formFields, setFormFields] = useState<any>({});
  const [amount, setAmount] = useState("");
  const [amountINR, setAmountINR] = useState("");
  const [balance, setBalance] = useState(0);
  const [saveBiller, setSaveBiller] = useState(false);
  const [billerName, setBillerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Biller Modal State
  const [editBiller, setEditBiller] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});

  const { jwtToken, userProfile } = useWeb3();
  const isBanned = userProfile?.isBanned;

  useEffect(() => {
    if (jwtToken) fetchData();
  }, [jwtToken]);

  const fetchData = async () => {
    if (!jwtToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${jwtToken}` };
      const [catRes, billRes, balRes] = await Promise.all([
        fetch("/api/user/utility/catalog", { headers }),
        fetch("/api/user/utility/billers", { headers }),
        fetch("/api/ledger/balance", { headers })
      ]);
      
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (billRes.ok) {
        const billData = await billRes.json();
        setBillers(billData.billers || []);
      }
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData.balance || 0);
      }
    } catch (err) {
      toast.error("Failed to load utility data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service: any) => {
    setSelectedService(service);
    setFormFields({});
    setAmount("");
    setSaveBiller(false);
    setBillerName("");
    
    // Auto-scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSavedBiller = (biller: any) => {
    setSelectedService(biller.service);
    
    try {
      const parsedDetails = typeof biller.details === 'string' ? JSON.parse(biller.details) : biller.details;
      setFormFields(parsedDetails);
    } catch (e) {
      console.error(e);
      setFormFields({});
    }
    
    setAmount("");
    setSaveBiller(false);
    
    // Auto-scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBiller = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saved biller?")) return;
    
    try {
      const res = await fetch(`/api/user/utility/billers?id=${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Biller deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Error deleting biller");
    }
  };

  const handleSaveEditBiller = async () => {
    try {
      const res = await fetch("/api/user/utility/billers", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({
          id: editBiller.id,
          billerName: editBiller.billerName,
          details: editFields
        })
      });

      if (!res.ok) throw new Error("Failed to update");
      toast.success("Biller updated successfully");
      setEditBiller(null);
      fetchData();
    } catch (err) {
      toast.error("Error updating biller");
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) {
      toast.error("Your account has been restricted.");
      return;
    }
    if (!selectedService || !amount) return;
    
    if (balance < parseFloat(amount)) {
      toast.error(`Insufficient balance. You need ${amount} ARES but have ${balance.toFixed(2)} ARES.`);
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        serviceId: selectedService.id,
        amount,
        details: formFields,
        saveBiller,
        billerName: saveBiller ? billerName : undefined
      };

      const res = await fetch("/api/user/utility/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      toast.success("Payment request submitted successfully!");
      setSelectedService(null);
      setAmount("");
      setFormFields({});
      
      // Refresh to get new saved biller if applicable
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Payment processing failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomFields = (service: any) => {
    if (!service || !service.customFields) return [];
    try {
      return typeof service.customFields === 'string' ? JSON.parse(service.customFields) : service.customFields;
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none tracking-tight">Utility Portal</h1>
        <p className="text-muted-foreground text-sm">Pay bills, top-up mobile, and manage your saved utility services.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Payment Form & Saved Billers */}
        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
          
          {/* Payment Form Card */}
          <Card className={selectedService ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Make Payment
              </CardTitle>
              <CardDescription>
                {selectedService ? `Paying: ${selectedService.name}` : "Select a service from the catalog"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedService ? (
                <form onSubmit={submitPayment} className="space-y-4">
                  {getCustomFields(selectedService).map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <Label htmlFor={`field-${idx}`}>{field.label} {field.required && "*"}</Label>
                      {field.type === 'dropdown' ? (
                        <Select
                          required={field.required}
                          value={formFields[field.label] || ""}
                          onValueChange={(val) => setFormFields({ ...formFields, [field.label]: val })}
                        >
                          <SelectTrigger id={`field-${idx}`}>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options || "").split(",").map((opt: string, i: number) => {
                              const trimmed = opt.trim();
                              if (!trimmed) return null;
                              return <SelectItem key={i} value={trimmed}>{trimmed}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          id={`field-${idx}`}
                          type={field.type || "text"}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          required={field.required}
                          value={formFields[field.label] || ""}
                          onChange={(e) => setFormFields({ ...formFields, [field.label]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="amount-inr">Amount (INR)</Label>
                    <Input 
                      id="amount-inr"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter amount in INR"
                      required
                      value={amountINR}
                      onChange={(e) => {
                        setAmountINR(e.target.value);
                        setAmount(e.target.value ? (parseFloat(e.target.value) / 10).toString() : "");
                      }}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="amount">Amount (ARES)</Label>
                    <Input 
                      id="amount"
                      type="number"
                      min={selectedService.minAmount}
                      max={selectedService.maxAmount}
                      step="0.01"
                      placeholder={`Min: ${selectedService.minAmount} - Max: ${selectedService.maxAmount}`}
                      required
                      disabled
                      value={amount}
                      className="bg-zinc-900/50 text-zinc-400"
                    />
                    <div className="text-xs text-zinc-500">Available Balance: {balance.toFixed(2)} ARES</div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Switch 
                      id="save-biller" 
                      checked={saveBiller} 
                      onCheckedChange={setSaveBiller}
                    />
                    <Label htmlFor="save-biller">Save this biller for future payments</Label>
                  </div>

                  {saveBiller && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="biller-name">Saved Name</Label>
                      <Input 
                        id="biller-name"
                        placeholder="e.g. Home Electricity, Mom's Phone"
                        required={saveBiller}
                        value={billerName}
                        onChange={(e) => setBillerName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="pt-4 flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay Now"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => {
                      setSelectedService(null);
                      setAmount("");
                      setAmountINR("");
                    }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                  <p>Choose a utility service or saved biller to proceed.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Billers Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Landmark className="h-5 w-5 text-muted-foreground" />
                Saved Billers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No saved billers yet. Save one during your next payment!
                </div>
              ) : (
                <div className="space-y-3">
                  {billers.map(biller => (
                    <div key={biller.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleSelectSavedBiller(biller)}
                      >
                        <div className="font-medium text-sm truncate">{biller.billerName}</div>
                        <div className="text-xs text-muted-foreground flex gap-1 truncate mt-0.5">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {biller.service?.category?.name}
                          </span>
                          <span className="truncate">{biller.service?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditBiller(biller);
                            try {
                              setEditFields(typeof biller.details === 'string' ? JSON.parse(biller.details) : biller.details);
                            } catch {
                              setEditFields({});
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteBiller(biller.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Catalog */}
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Service Catalog</CardTitle>
              <CardDescription>Select a category to view available utility services</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={categories[0]?.name} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto p-1 mb-6 justify-start bg-transparent gap-2">
                  {categories.map((cat: any) => (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.name}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        {getIcon(cat.icon || cat.name)}
                        <span>{cat.name}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {categories.map((cat: any) => (
                  <TabsContent key={cat.id} value={cat.name} className="space-y-4">
                    {cat.services.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        No active services found in this category.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cat.services.map((service: any) => (
                          <div 
                            key={service.id} 
                            className={`p-5 rounded-xl border transition-all cursor-pointer hover:border-primary hover:shadow-md ${selectedService?.id === service.id ? 'border-primary ring-1 ring-primary shadow-sm bg-primary/5' : 'bg-card'}`}
                            onClick={() => handleSelectService(service)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-base">{service.name}</h3>
                              <div className="bg-primary/10 text-primary p-2 rounded-full">
                                {getIcon(cat.icon || cat.name)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                              {service.description}
                            </p>
                            <div className="text-xs font-medium text-muted-foreground bg-muted/50 inline-flex items-center px-2 py-1 rounded-md">
                              Limits: {service.minAmount} - {service.maxAmount} ARES
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Biller Dialog */}
      <Dialog open={!!editBiller} onOpenChange={(open) => !open && setEditBiller(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saved Biller</DialogTitle>
            <DialogDescription>
              Update your saved details for {editBiller?.service?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Saved Name</Label>
              <Input 
                value={editBiller?.billerName || ""}
                onChange={(e) => setEditBiller({...editBiller, billerName: e.target.value})}
              />
            </div>
            
            {editBiller?.service && getCustomFields(editBiller.service).map((field: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <Label>{field.label} {field.required && "*"}</Label>
                <Input 
                  type={field.type || "text"}
                  required={field.required}
                  value={editFields[field.label] || ""}
                  onChange={(e) => setEditFields({ ...editFields, [field.label]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBiller(null)}>Cancel</Button>
            <Button onClick={handleSaveEditBiller}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
