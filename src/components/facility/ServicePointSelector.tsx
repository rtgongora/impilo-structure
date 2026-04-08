// Service Point Selector — lets facility users pick their active service point
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Activity, Stethoscope, Bed, Pill, FlaskConical,
  ScanLine, Syringe, DollarSign, Shield, UserCheck, ArrowLeft,
  Clock, Users, Building2, Radio,
} from "lucide-react";

export type ServicePointType =
  | "front-desk" | "triage" | "consultation" | "nursing-station"
  | "pharmacy" | "laboratory" | "radiology" | "theatre"
  | "billing" | "supervisor" | "emergency" | "inpatient"
  | "casualty" | "procedure-room";

export interface ServicePointConfig {
  id: ServicePointType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  category: "clinical" | "support" | "admin";
}

export const SERVICE_POINTS: ServicePointConfig[] = [
  { id: "front-desk", label: "Front Desk", description: "Registration, check-in, queue assignment", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-500/10", category: "clinical" },
  { id: "triage", label: "Triage", description: "Vitals, categorisation, fast-track routing", icon: Activity, color: "text-orange-600", bg: "bg-orange-500/10", category: "clinical" },
  { id: "consultation", label: "Consultation", description: "Patient list, clinical workspace, orders, e-Rx", icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-500/10", category: "clinical" },
  { id: "nursing-station", label: "Nursing Station", description: "Bed board, medication tasks, observations, handover", icon: Bed, color: "text-purple-600", bg: "bg-purple-500/10", category: "clinical" },
  { id: "casualty", label: "Casualty (ED)", description: "Emergency department, acute presentations, resuscitation", icon: Radio, color: "text-red-600", bg: "bg-red-500/10", category: "clinical" },
  { id: "emergency", label: "Trauma Bay", description: "Trauma activation, rapid assessment, stabilisation", icon: Radio, color: "text-red-700", bg: "bg-red-600/10", category: "clinical" },
  { id: "procedure-room", label: "Procedure Room", description: "Minor procedures, biopsies, wound care, sedation", icon: Syringe, color: "text-pink-600", bg: "bg-pink-500/10", category: "clinical" },
  { id: "inpatient", label: "Inpatient / Ward", description: "Admissions, rounds, discharge planning", icon: Bed, color: "text-violet-600", bg: "bg-violet-500/10", category: "clinical" },
  { id: "pharmacy", label: "Pharmacy", description: "Prescription queue, dispensing, stock", icon: Pill, color: "text-green-600", bg: "bg-green-500/10", category: "support" },
  { id: "laboratory", label: "Laboratory", description: "Order queue, results entry, sample tracking", icon: FlaskConical, color: "text-indigo-600", bg: "bg-indigo-500/10", category: "support" },
  { id: "radiology", label: "Radiology", description: "Imaging queue, PACS viewer, reports", icon: ScanLine, color: "text-cyan-600", bg: "bg-cyan-500/10", category: "support" },
  { id: "theatre", label: "Theatre", description: "Booking, checklists, anaesthesia, notes", icon: Syringe, color: "text-rose-600", bg: "bg-rose-500/10", category: "support" },
  { id: "billing", label: "Billing & Cashier", description: "Charges, payments, claims, receipts", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-500/10", category: "admin" },
  { id: "supervisor", label: "Supervisor / Admin", description: "Staff, queues, rosters, reports, approvals", icon: Shield, color: "text-slate-600", bg: "bg-slate-500/10", category: "admin" },
];

interface ServicePointSelectorProps {
  facilityName: string;
  onSelect: (sp: ServicePointType) => void;
  onBack: () => void;
}

export function ServicePointSelector({ facilityName, onSelect, onBack }: ServicePointSelectorProps) {
  const clinical = SERVICE_POINTS.filter(sp => sp.category === "clinical");
  const support = SERVICE_POINTS.filter(sp => sp.category === "support");
  const admin = SERVICE_POINTS.filter(sp => sp.category === "admin");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Select Service Point</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {facilityName}
            </p>
          </div>
        </div>

        <SectionGroup title="Clinical" items={clinical} onSelect={onSelect} />
        <SectionGroup title="Support Services" items={support} onSelect={onSelect} />
        <SectionGroup title="Administration" items={admin} onSelect={onSelect} />
      </motion.div>
    </div>
  );
}

function SectionGroup({ title, items, onSelect }: { title: string; items: ServicePointConfig[]; onSelect: (sp: ServicePointType) => void }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1 mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(sp => (
          <motion.button
            key={sp.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(sp.id)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${sp.bg} flex items-center justify-center shrink-0`}>
                <sp.icon className={`h-5 w-5 ${sp.color}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground">{sp.label}</h3>
                <p className="text-xs text-muted-foreground truncate">{sp.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
