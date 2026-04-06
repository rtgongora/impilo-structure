import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Bug, Droplets, Megaphone, Send, CheckCircle, Clock, MapPin } from "lucide-react";
import { useState } from "react";

const MY_REPORTS = [
  { id: "CR-001", type: "Water Contamination", category: "environmental", location: "Glen Norah Borehole #3", status: "investigating", submitted: "2026-04-03", lastUpdate: "2026-04-05" },
  { id: "CR-002", type: "Suspected Cholera Cases", category: "disease", location: "Budiriro 5", status: "responded", submitted: "2026-03-28", lastUpdate: "2026-04-01" },
  { id: "CR-003", type: "Illegal Dumping", category: "environmental", location: "Near Mbare Musika", status: "resolved", submitted: "2026-03-15", lastUpdate: "2026-03-22" },
];

const REPORT_CATEGORIES = [
  { value: "disease", label: "Disease / Unusual Symptoms", icon: Bug, description: "Report suspected outbreaks, unusual illness clusters, or disease symptoms in your community", color: "text-destructive" },
  { value: "environmental", label: "Environmental Concern", icon: Droplets, description: "Water contamination, sanitation issues, pest infestations, air quality, illegal dumping", color: "text-warning" },
  { value: "food_safety", label: "Food Safety", icon: AlertTriangle, description: "Unsafe food handling, expired products, unhygienic food premises", color: "text-orange-500" },
  { value: "service", label: "Health Service Complaint", icon: Megaphone, description: "Issues with health facilities, providers, or public health services", color: "text-primary" },
];

export function PortalHealthReporting() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowForm(false); setSelectedCategory(null); }, 3000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Report a Health Concern</CardTitle>
          <CardDescription>Help keep your community safe. Reports are reviewed by local public health officers and you'll be notified of progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => { setSelectedCategory(cat.value); setShowForm(true); }}
                  className="p-4 border rounded-lg text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-muted"><cat.icon className={`h-5 w-5 ${cat.color}`} /></div>
                    <span className="font-semibold text-sm">{cat.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </button>
              ))}
            </div>
          ) : submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h3 className="text-lg font-bold">Report Submitted Successfully</h3>
              <p className="text-sm text-muted-foreground">Your report has been received and assigned to a public health officer. You'll receive updates on progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">{selectedCategory?.replace(/_/g, " ")}</Badge>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowForm(false); setSelectedCategory(null); }}>Change category</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>What are you reporting?</Label>
                  <Input placeholder="Brief title, e.g. 'Dirty water from borehole'" className="mt-1" />
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="Area, address, or landmark" className="flex-1" />
                    <Button variant="outline" size="icon"><MapPin className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Describe the situation</Label>
                <Textarea placeholder="Provide as much detail as possible: What did you see? When did it start? How many people are affected?" className="mt-1 min-h-[100px]" />
              </div>

              {selectedCategory === "disease" && (
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-destructive/5">
                  <div>
                    <Label className="text-xs">How many people affected?</Label>
                    <Select><SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Just me / 1 person</SelectItem>
                        <SelectItem value="2-5">2-5 people</SelectItem>
                        <SelectItem value="6-20">6-20 people</SelectItem>
                        <SelectItem value="20+">More than 20</SelectItem>
                        <SelectItem value="unknown">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Main symptoms observed</Label>
                    <Select><SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diarrhoea">Diarrhoea / Vomiting</SelectItem>
                        <SelectItem value="fever">Fever / Body Aches</SelectItem>
                        <SelectItem value="rash">Skin Rash</SelectItem>
                        <SelectItem value="respiratory">Cough / Breathing Difficulty</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">You can also attach photos (optional)</Label>
                <Input type="file" accept="image/*" multiple className="mt-1 text-xs" />
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                Your identity is protected. Only authorized public health officers can view your contact details.
              </div>

              <div className="flex gap-2">
                <Button className="gap-1" onClick={handleSubmit}><Send className="h-4 w-4" /> Submit Report</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setSelectedCategory(null); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Reports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">My Reports</CardTitle>
          <CardDescription>Track the status of your submitted health concerns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MY_REPORTS.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.type}</span>
                    <Badge variant="outline" className="text-xs capitalize">{r.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {r.location}
                    <span>•</span>
                    <span>Submitted {r.submitted}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    r.status === "resolved" ? "bg-success/10 text-success" :
                    r.status === "responded" ? "bg-primary/10 text-primary" :
                    "bg-warning/10 text-warning"
                  }>
                    {r.status === "investigating" && <Clock className="h-3 w-3 mr-1" />}
                    {r.status === "resolved" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {r.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs">Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}