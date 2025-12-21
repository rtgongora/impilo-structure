import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  HelpCircle,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Users,
  Bed,
  Syringe,
  FlaskConical,
  DollarSign,
  Shield,
  Settings,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Play,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface UserGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "video" | "document" | "interactive";
  duration?: string;
  lastUpdated: string;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  articles: number;
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I register a new patient?",
    answer: "Navigate to 'Patient Registration' from the main menu. Fill in the patient demographics, capture biometrics if available, and submit. The system will generate an Impilo ID automatically.",
    category: "Registration",
  },
  {
    id: "2",
    question: "How do I admit a patient to a bed?",
    answer: "Go to 'Bed Management', find an available bed, click on it and select 'Admit Patient'. Search for the patient, select them, and confirm the admission.",
    category: "Clinical",
  },
  {
    id: "3",
    question: "How do I order medications?",
    answer: "Open the patient's encounter, go to the 'Orders' section, click 'New Order', select 'Medication', search for the drug, enter dosage and frequency, then submit.",
    category: "Orders",
  },
  {
    id: "4",
    question: "How do I view lab results?",
    answer: "Lab results appear in the patient's encounter under 'Results' tab. Critical values are highlighted in red. You can also access the Laboratory module for a full worklist.",
    category: "Laboratory",
  },
  {
    id: "5",
    question: "How do I process a payment?",
    answer: "Go to 'Payments', search for the patient, view their outstanding balance, select items to pay, choose payment method (cash, card, mobile money), and complete the transaction.",
    category: "Billing",
  },
  {
    id: "6",
    question: "How do I transfer a patient between wards?",
    answer: "In Bed Management, click on the patient's current bed, select 'Transfer', choose the destination ward and bed, add transfer notes, and confirm.",
    category: "Clinical",
  },
  {
    id: "7",
    question: "How do I create a shift handoff report?",
    answer: "Navigate to 'Shift Handoff', select your patients, add notes for each patient's status, document any pending tasks, and submit to the incoming staff.",
    category: "Clinical",
  },
  {
    id: "8",
    question: "How do I reset my password?",
    answer: "On the login screen, click 'Forgot Password', enter your provider ID, and follow the instructions sent to your registered email or phone.",
    category: "Account",
  },
  {
    id: "9",
    question: "How do I view imaging studies?",
    answer: "Open PACS Imaging from the main menu or from within a patient encounter. Select the study to view. Use the toolbar to zoom, measure, and annotate images.",
    category: "Imaging",
  },
  {
    id: "10",
    question: "How do I discharge a patient?",
    answer: "In the patient encounter, go to 'Outcome' section, complete the discharge summary, ensure all orders are completed or discontinued, finalize charges, then submit discharge.",
    category: "Clinical",
  },
];

const userGuides: UserGuide[] = [
  {
    id: "1",
    title: "Getting Started with Impilo EHR",
    description: "Learn the basics of navigating the system, logging in, and finding your way around.",
    category: "Basics",
    type: "video",
    duration: "8 min",
    lastUpdated: "2024-12-15",
  },
  {
    id: "2",
    title: "Patient Registration Complete Guide",
    description: "Step-by-step guide to registering new patients including biometric capture and ID generation.",
    category: "Registration",
    type: "document",
    lastUpdated: "2024-12-10",
  },
  {
    id: "3",
    title: "Clinical Documentation Best Practices",
    description: "How to write effective SOAP notes, document assessments, and maintain quality records.",
    category: "Clinical",
    type: "document",
    lastUpdated: "2024-12-18",
  },
  {
    id: "4",
    title: "Medication Administration & MAR",
    description: "Complete workflow for medication verification, administration, and documentation.",
    category: "Nursing",
    type: "video",
    duration: "12 min",
    lastUpdated: "2024-12-12",
  },
  {
    id: "5",
    title: "Order Entry & CPOE",
    description: "How to enter clinical orders, use order sets, and manage the ordering workflow.",
    category: "Orders",
    type: "interactive",
    duration: "15 min",
    lastUpdated: "2024-12-14",
  },
  {
    id: "6",
    title: "Bed Management & Admissions",
    description: "Managing ward beds, admitting patients, transfers, and discharge workflows.",
    category: "Operations",
    type: "document",
    lastUpdated: "2024-12-08",
  },
  {
    id: "7",
    title: "Laboratory Orders & Results",
    description: "Ordering labs, reviewing results, handling critical values, and result acknowledgment.",
    category: "Laboratory",
    type: "video",
    duration: "10 min",
    lastUpdated: "2024-12-16",
  },
  {
    id: "8",
    title: "Billing & Payments Guide",
    description: "Processing payments, managing charges, insurance claims, and financial reconciliation.",
    category: "Finance",
    type: "document",
    lastUpdated: "2024-12-05",
  },
];

const docSections: DocSection[] = [
  { id: "clinical", title: "Clinical Workflows", description: "Patient care, documentation, and clinical decision support", icon: Stethoscope, articles: 24 },
  { id: "nursing", title: "Nursing Guides", description: "MAR, care plans, assessments, and nursing workflows", icon: Users, articles: 18 },
  { id: "beds", title: "Bed & Ward Management", description: "Admissions, transfers, discharges, and capacity planning", icon: Bed, articles: 12 },
  { id: "pharmacy", title: "Pharmacy & Medications", description: "Dispensing, inventory, and medication safety", icon: Syringe, articles: 15 },
  { id: "lab", title: "Laboratory", description: "Orders, results, specimen collection, and LIMS integration", icon: FlaskConical, articles: 10 },
  { id: "billing", title: "Billing & Finance", description: "Charges, payments, claims, and revenue cycle", icon: DollarSign, articles: 14 },
  { id: "security", title: "Security & Compliance", description: "Access control, audit logs, and regulatory compliance", icon: Shield, articles: 8 },
  { id: "admin", title: "System Administration", description: "User management, configuration, and maintenance", icon: Settings, articles: 20 },
];

const faqCategories = ["All", "Registration", "Clinical", "Orders", "Laboratory", "Billing", "Imaging", "Account"];

export default function HelpDesk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState("All");
  const [guideCategory, setGuideCategory] = useState("All");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedFaqCategory === "All" || faq.category === selectedFaqCategory;
    return matchesSearch && matchesCategory;
  });

  const guideCategories = ["All", ...new Set(userGuides.map((g) => g.category))];
  const filteredGuides = userGuides.filter((guide) => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = guideCategory === "All" || guide.category === guideCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "interactive": return <Play className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "video": return <Badge className="bg-red-500">Video</Badge>;
      case "document": return <Badge className="bg-blue-500">Document</Badge>;
      case "interactive": return <Badge className="bg-green-500">Interactive</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <AppLayout title="Help & Support">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground">Find answers, guides, and documentation for Impilo EHR</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Tips</h3>
                <p className="text-sm text-muted-foreground">Keyboard shortcuts & tricks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">What's New</h3>
                <p className="text-sm text-muted-foreground">Latest features & updates</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Report Issue</h3>
                <p className="text-sm text-muted-foreground">Submit a bug or problem</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="faqs" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="faqs" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2">
              <BookOpen className="h-4 w-4" />
              User Guides
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs">
            <div className="flex flex-wrap gap-2 mb-6">
              {faqCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedFaqCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFaqCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50">
                        <div className="flex items-center gap-3 text-left">
                          <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="pl-7">
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline">{faq.category}</Badge>
                            <Button variant="link" size="sm" className="h-auto p-0">
                              Was this helpful?
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFaqs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No FAQs match your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Guides Tab */}
          <TabsContent value="guides">
            <div className="flex flex-wrap gap-2 mb-6">
              {guideCategories.map((category) => (
                <Button
                  key={category}
                  variant={guideCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGuideCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(guide.type)}
                        {getTypeBadge(guide.type)}
                      </div>
                      {guide.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {guide.duration}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="outline">{guide.category}</Badge>
                      <span className="text-xs text-muted-foreground">Updated {guide.lastUpdated}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredGuides.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No guides match your search</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {docSections.map((section) => (
                <Card key={section.id} className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{section.articles} articles</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Download Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloadable Resources
                </CardTitle>
                <CardDescription>PDF guides, quick reference cards, and training materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto py-4 justify-start gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">Quick Start Guide</p>
                      <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 justify-start gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">Keyboard Shortcuts</p>
                      <p className="text-xs text-muted-foreground">PDF • 0.5 MB</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 justify-start gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">Clinical Workflows</p>
                      <p className="text-xs text-muted-foreground">PDF • 5.1 MB</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
                <p className="text-muted-foreground">Our support team is available 24/7 to assist you.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Support
                </Button>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email Us
                </Button>
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Live Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
