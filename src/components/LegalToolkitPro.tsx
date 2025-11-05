// src/components/LegalToolkitPro.tsx
import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, IdCard, Printer, RefreshCw, AlertTriangle, Info, BookOpen, Shield } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useSubscription } from "@/context/SubscriptionContext";
import { ALL_STATES, PUBLIC_RECORDS, STOP_AND_ID, CANNABIS, HOSTILE_STATES, NOTICE_RULES, type StateCode } from "@/data/legalDatasets";

// -----------------------------
// Helpers
// -----------------------------
const fmtDate = (d = new Date()) => d.toLocaleDateString();
function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let a = 0;
  while (a < days) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) a++;
  }
  return d;
}

function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------
// Validation (Zod)
// -----------------------------
const DocType = z.enum([
  "FOIA Request",
  "State Public Records Request",
  "ID Rights Card",
  "Cease and Desist Letter",
  "Notice of Claim",
  "Pre-Suit Notice",
  "Subpoena Duces Tecum",
  "Discovery Request",
  "Marijuana Law Lookup"
]);
type DocType = z.infer<typeof DocType>;

const BaseFormSchema = z.object({
  documentType: DocType,
  agency: z.string().optional().default(""),
  selectedState: z.custom<StateCode | "">().default(""),
  jurisdiction: z.string().optional().default(""),
  incident: z.string().optional().default(""),
  recipient: z.string().optional().default(""),
  damages: z.string().optional().default(""),
  violationType: z.enum([
    "harassment",
    "intellectual_property",
    "debt_collection",
    "trespass",
    "defamation",
    "contract",
    "privacy"
  ]).default("harassment"),
  claimType: z.enum([
    "general",
    "government",
    "medical"
  ]).default("general"),
  plaintiffName: z.string().optional().default(""),
  defendantName: z.string().optional().default(""),
  caseNumber: z.string().optional().default(""),
  courtName: z.string().optional().default(""),
});

type FormState = z.infer<typeof BaseFormSchema> & {
  timeLimit: string;
  statute: string;
  generated: string;
};

type Action =
  | { type: "set"; key: keyof FormState; value: any }
  | { type: "hydrate"; payload: Partial<FormState> }
  | { type: "generate"; value: string }
  | { type: "reset" };

function reducer(state: FormState, action: Action): FormState {
  switch(action.type){
    case "set":
      return { ...state, [action.key]: action.value } as FormState;
    case "hydrate":
      return { ...state, ...action.payload };
    case "generate":
      return { ...state, generated: action.value };
    case "reset":
      return { ...state, ...initialState };
  }
}

// -----------------------------
// State
// -----------------------------
const initialState: FormState = {
  documentType: "FOIA Request",
  agency: "",
  selectedState: "",
  jurisdiction: "",
  incident: "",
  recipient: "",
  damages: "",
  violationType: "harassment",
  claimType: "general",
  plaintiffName: "",
  defendantName: "",
  caseNumber: "",
  courtName: "",
  timeLimit: "",
  statute: "",
  generated: "",
};

// -----------------------------
// Component
// -----------------------------
export default function LegalToolkitPro() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const idCardRef = useRef<HTMLDivElement | null>(null);
  const { plan } = useSubscription();

  // Persist key fields (without generated text)
  useEffect(() => {
    const saved = localStorage.getItem("ltp-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: "hydrate", payload: parsed });
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    const toSave = { ...state, generated: "" };
    localStorage.setItem("ltp-state", JSON.stringify(toSave));
  }, [state]);

  const rightsForState = useMemo(() => {
    if (!state.selectedState) return null;
    return STOP_AND_ID[state.selectedState];
  }, [state.selectedState]);

  const cannabisForState = useMemo(() => {
    if (!state.selectedState) return null;
    return CANNABIS[state.selectedState];
  }, [state.selectedState]);

  const hostileForState = useMemo(() => {
    if (!state.selectedState) return null;
    return HOSTILE_STATES[state.selectedState];
  }, [state.selectedState]);

  const noticeForState = useMemo(() => {
    if (!state.selectedState) return null;
    return NOTICE_RULES[state.selectedState];
  }, [state.selectedState]);

  const recordsForState = useMemo(() => {
    if (!state.selectedState) return null;
    return PUBLIC_RECORDS[state.selectedState];
  }, [state.selectedState]);

  // Generate legal document
  const generateDocument = () => {
    const { documentType, agency, jurisdiction, incident, recipient, damages, violationType, claimType, plaintiffName, defendantName, caseNumber, courtName } = state;
    let text = "";

    switch (documentType) {
      case "FOIA Request":
        text = `FEDERAL FREEDOM OF INFORMATION ACT REQUEST

To: ${agency || "[Agency Name]"}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

I request the following records under the Freedom of Information Act:

${incident || "[Description of records requested]"}

Please provide all responsive records in electronic format if possible.

Requester: ${plaintiffName || "[Your Name]"}
Date: ${fmtDate()}`;
        break;

      case "State Public Records Request":
        text = `STATE PUBLIC RECORDS REQUEST

To: ${agency || "[Agency Name]"}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

I request the following records under your state's public records law:

${incident || "[Description of records requested]"}

Please provide all responsive records in electronic format if possible.

Requester: ${plaintiffName || "[Your Name]"}
Date: ${fmtDate()}`;
        break;

      case "ID Rights Card":
        text = `RIGHT TO REMAIN SILENT CARD

I DO NOT CONSENT TO A SEARCH
I DO NOT WANT TO SPEAK TO POLICE
I WANT TO SPEAK TO AN ATTORNEY
I DO NOT WANT TO SIGN ANYTHING

${plaintiffName ? `Name: ${plaintiffName}` : ""}

This card asserts my constitutional rights under the Fourth, Fifth, and Sixth Amendments to the U.S. Constitution. I do not consent to any searches, and I invoke my right to remain silent and my right to legal counsel.

Date: ${fmtDate()}`;
        break;

      case "Cease and Desist Letter":
        text = `CEASE AND DESIST LETTER

To: ${recipient || "[Recipient Name/Organization]"}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

I am writing to demand that you immediately cease and desist from the following conduct:

${incident || "[Description of harmful conduct]"}

This conduct violates my rights and is causing me damages including:

${damages || "[Description of damages]"}.

If you do not immediately stop this conduct, I will pursue all available legal remedies.

${plaintiffName ? `Sincerely,\n${plaintiffName}` : ""}
Date: ${fmtDate()}`;
        break;

      case "Notice of Claim":
        text = `NOTICE OF CLAIM

To: ${recipient || "[Government Entity]"}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

I am providing notice of a claim against your entity for:

${incident || "[Description of incident]"}

The damages I have suffered include:

${damages || "[Description of damages]"}

${plaintiffName ? `Claimant: ${plaintiffName}` : ""}
${defendantName ? `Against: ${defendantName}` : ""}
Date: ${fmtDate()}`;
        break;

      case "Pre-Suit Notice":
        text = `PRE-SUIT NOTICE

To: ${recipient || "[Recipient Name/Organization]"}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ""}

Before filing suit, I am providing notice of my intent to pursue legal action for:

${incident || "[Description of legal issue]"}

The damages I have suffered include:

${damages || "[Description of damages]"}

I request that this matter be resolved without litigation.

${plaintiffName ? `Sincerely,\n${plaintiffName}` : ""}
Date: ${fmtDate()}`;
        break;

      case "Subpoena Duces Tecum":
        text = `SUBPOENA DUCES TECUM

To: ${recipient || "[Person or Organization]"}
${courtName ? `Court: ${courtName}` : ""}
${caseNumber ? `Case Number: ${caseNumber}` : ""}

YOU ARE HEREBY COMMANDED to appear and produce the following documents:

${incident || "[List of documents to be produced]"}

Failure to comply with this subpoena may result in legal consequences.

Date: ${fmtDate()}`;
        break;

      case "Discovery Request":
        text = `DISCOVERY REQUEST

To: ${recipient || "[Opposing Party or Attorney]"}
${courtName ? `Court: ${courtName}` : ""}
${caseNumber ? `Case Number: ${caseNumber}` : ""}

I request the following discovery materials:

${incident || "[Description of discovery requested]"}

This request is made pursuant to the applicable rules of civil procedure.

${plaintiffName ? `Requesting Party: ${plaintiffName}` : ""}
Date: ${fmtDate()}`;
        break;

      case "Marijuana Law Lookup":
        text = `CANNABIS/MARIJUANA LAW INFORMATION

State: ${ALL_STATES.find(s => s.code === state.selectedState)?.name || "[State]"}

${cannabisForState ? `Summary: ${cannabisForState.summary}` : "No information available for this state."}

${cannabisForState?.citation ? `Legal Citation: ${cannabisForState.citation}` : ""}

Date: ${fmtDate()}`;
        break;

      default:
        text = "Document type not recognized.";
    }

    dispatch({ type: "generate", value: text });
  };

  // Download ID card as PNG
  const downloadIdCard = async () => {
    if (!idCardRef.current) return;
    try {
      const dataUrl = await toPng(idCardRef.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "id-rights-card.png";
      link.click();
    } catch (err) {
      console.error("Failed to download ID card", err);
    }
  };

  // Download ID card as PDF
  const downloadIdCardAsPdf = async () => {
    if (!idCardRef.current) return;
    try {
      const dataUrl = await toPng(idCardRef.current);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [idCardRef.current.offsetWidth, idCardRef.current.offsetHeight]
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, idCardRef.current.offsetWidth, idCardRef.current.offsetHeight);
      pdf.save("id-rights-card.pdf");
    } catch (err) {
      console.error("Failed to download ID card as PDF", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  Legal Toolkit Pro
                </h1>
                <p className="text-primary-100 text-sm sm:text-base mt-1">
                  Professional Legal Document Generation
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="self-start sm:self-center bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm"
            >
              Version 1.0.0
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Tabs defaultValue="documents" className="space-y-6">
          {/* Horizontal Scrolling Tabs */}
          <div className="bg-white rounded-2xl shadow-card p-2 overflow-x-auto">
            <TabsList className="inline-flex min-w-full sm:grid sm:grid-cols-5 h-auto gap-2 bg-transparent">
              <TabsTrigger
                value="documents"
                className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 whitespace-nowrap data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm sm:text-base font-medium">Documents</span>
              </TabsTrigger>
              <TabsTrigger
                value="cannabis"
                className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 whitespace-nowrap data-[state=active]:bg-success-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm sm:text-base font-medium">Cannabis</span>
              </TabsTrigger>
              <TabsTrigger
                value="id-card"
                className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 whitespace-nowrap data-[state=active]:bg-warning-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <IdCard className="h-4 w-4" />
                <span className="text-sm sm:text-base font-medium">ID Card</span>
              </TabsTrigger>
              <TabsTrigger
                value="stop-id"
                className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 whitespace-nowrap data-[state=active]:bg-secondary-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm sm:text-base font-medium">Stop & ID</span>
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="flex items-center gap-2 min-h-[44px] px-4 sm:px-6 whitespace-nowrap data-[state=active]:bg-accent-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-sm sm:text-base font-medium">Resources</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Document Generation Tab */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card className="shadow-soft border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-primary-900">
                  <div className="bg-primary-600 p-2 rounded-lg">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Legal Document Generator
                </CardTitle>
                <p className="text-sm text-primary-700 mt-2">
                  Create professional legal documents with ease
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Document Type Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="documentType" className="text-base font-semibold text-secondary-900">
                    Document Type
                  </Label>
                  <Select
                    value={state.documentType}
                    onValueChange={(value) => dispatch({ type: "set", key: "documentType", value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOIA Request">FOIA Request</SelectItem>
                      <SelectItem value="State Public Records Request">State Public Records Request</SelectItem>
                      <SelectItem value="ID Rights Card">ID Rights Card</SelectItem>
                      <SelectItem value="Cease and Desist Letter">Cease and Desist Letter</SelectItem>
                      <SelectItem value="Notice of Claim">Notice of Claim</SelectItem>
                      <SelectItem value="Pre-Suit Notice">Pre-Suit Notice</SelectItem>
                      <SelectItem value="Subpoena Duces Tecum">Subpoena Duces Tecum</SelectItem>
                      <SelectItem value="Discovery Request">Discovery Request</SelectItem>
                      <SelectItem value="Marijuana Law Lookup">Marijuana Law Lookup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Form Fields in Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="agency" className="text-sm font-semibold text-secondary-900">
                      Agency
                    </Label>
                    <Input
                      id="agency"
                      value={state.agency}
                      onChange={(e) => dispatch({ type: "set", key: "agency", value: e.target.value })}
                      placeholder="e.g., Department of Justice"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jurisdiction" className="text-sm font-semibold text-secondary-900">
                      Jurisdiction
                    </Label>
                    <Input
                      id="jurisdiction"
                      value={state.jurisdiction}
                      onChange={(e) => dispatch({ type: "set", key: "jurisdiction", value: e.target.value })}
                      placeholder="e.g., Federal, State of California"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recipient" className="text-sm font-semibold text-secondary-900">
                      Recipient
                    </Label>
                    <Input
                      id="recipient"
                      value={state.recipient}
                      onChange={(e) => dispatch({ type: "set", key: "recipient", value: e.target.value })}
                      placeholder="e.g., Person or organization name"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="plaintiffName" className="text-sm font-semibold text-secondary-900">
                      Your Name
                    </Label>
                    <Input
                      id="plaintiffName"
                      value={state.plaintiffName}
                      onChange={(e) => dispatch({ type: "set", key: "plaintiffName", value: e.target.value })}
                      placeholder="Your full name"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="defendantName" className="text-sm font-semibold text-secondary-900">
                      Defendant Name
                    </Label>
                    <Input
                      id="defendantName"
                      value={state.defendantName}
                      onChange={(e) => dispatch({ type: "set", key: "defendantName", value: e.target.value })}
                      placeholder="Defendant's name"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="caseNumber" className="text-sm font-semibold text-secondary-900">
                      Case Number
                    </Label>
                    <Input
                      id="caseNumber"
                      value={state.caseNumber}
                      onChange={(e) => dispatch({ type: "set", key: "caseNumber", value: e.target.value })}
                      placeholder="Case number (if applicable)"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="courtName" className="text-sm font-semibold text-secondary-900">
                      Court Name
                    </Label>
                    <Input
                      id="courtName"
                      value={state.courtName}
                      onChange={(e) => dispatch({ type: "set", key: "courtName", value: e.target.value })}
                      placeholder="Court name (if applicable)"
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Full-width textarea fields */}
                <div className="grid gap-2">
                  <Label htmlFor="incident" className="text-sm font-semibold text-secondary-900">
                    Incident Description
                  </Label>
                  <Textarea
                    id="incident"
                    value={state.incident}
                    onChange={(e) => dispatch({ type: "set", key: "incident", value: e.target.value })}
                    placeholder="Describe the incident or records requested"
                    className="min-h-[120px] text-base resize-y"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="damages" className="text-sm font-semibold text-secondary-900">
                    Damages
                  </Label>
                  <Textarea
                    id="damages"
                    value={state.damages}
                    onChange={(e) => dispatch({ type: "set", key: "damages", value: e.target.value })}
                    placeholder="Describe any damages suffered"
                    className="min-h-[120px] text-base resize-y"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-secondary-200">
                  <Button
                    onClick={generateDocument}
                    className="min-h-[44px] flex-1 sm:flex-initial bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate Document
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(state.generated)}
                    disabled={!state.generated}
                    className="min-h-[44px] flex-1 sm:flex-initial border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-50 font-medium text-base"
                  >
                    <Copy className="mr-2 h-5 w-5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadText("legal-document.txt", state.generated)}
                    disabled={!state.generated}
                    className="min-h-[44px] flex-1 sm:flex-initial border-success-300 text-success-700 hover:bg-success-50 disabled:opacity-50 font-medium text-base"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download
                  </Button>
                </div>

                {/* Generated Document Preview */}
                {state.generated ? (
                  <div className="mt-6 p-4 sm:p-6 border-2 border-primary-200 rounded-xl bg-gradient-to-br from-primary-50 to-white shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse"></div>
                      <span className="text-sm font-semibold text-primary-900">Generated Document</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-sm sm:text-base text-secondary-800 leading-relaxed">
                      {state.generated}
                    </pre>
                  </div>
                ) : (
                  <div className="mt-6 p-8 sm:p-12 border-2 border-dashed border-secondary-300 rounded-xl bg-secondary-50 text-center">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-secondary-400 mx-auto mb-4" />
                    <p className="text-secondary-600 text-base sm:text-lg font-medium">
                      No document generated yet
                    </p>
                    <p className="text-secondary-500 text-sm mt-2">
                      Fill in the fields above and click "Generate Document" to create your legal document
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cannabis Laws Tab */}
          <TabsContent value="cannabis" className="space-y-6 mt-6">
            <Card className="shadow-soft border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-success-50 to-success-100 border-b border-success-200 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-success-900">
                  <div className="bg-success-600 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Cannabis Laws Lookup
                </CardTitle>
                <p className="text-sm text-success-700 mt-2">
                  Find cannabis and marijuana laws for your state
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="grid gap-4 mb-6">
                  <Label htmlFor="selectedState" className="text-base font-semibold text-secondary-900">
                    Select State
                  </Label>
                  <Select
                    value={state.selectedState}
                    onValueChange={(value) => dispatch({ type: "set", key: "selectedState", value: value as StateCode })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {cannabisForState ? (
                  <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-success-50 to-white rounded-xl border border-success-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-success-600 p-2 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-success-900 mb-2">
                          {cannabisForState.title}
                        </h3>
                        <p className="text-base text-secondary-700 leading-relaxed">
                          {cannabisForState.summary}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-success-200">
                      <p className="text-sm text-secondary-600 mb-3">
                        <span className="font-semibold">Legal Citation:</span> {cannabisForState.citation}
                      </p>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.open(cannabisForState.url, "_blank")}
                        className="min-h-[44px] w-full sm:w-auto border-success-300 text-success-700 hover:bg-success-50 font-medium"
                      >
                        <BookOpen className="mr-2 h-5 w-5" />
                        View Official Source
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 border-2 border-dashed border-secondary-300 rounded-xl bg-secondary-50 text-center">
                    <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-secondary-400 mx-auto mb-4" />
                    <p className="text-secondary-600 text-base sm:text-lg font-medium">
                      No state selected
                    </p>
                    <p className="text-secondary-500 text-sm mt-2">
                      Please select a state to view its cannabis and marijuana laws
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ID Card Tab */}
          <TabsContent value="id-card" className="space-y-6 mt-6">
            <Card className="shadow-soft border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-warning-50 to-warning-100 border-b border-warning-200 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-warning-900">
                  <div className="bg-warning-600 p-2 rounded-lg">
                    <IdCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  ID Rights Card Generator
                </CardTitle>
                <p className="text-sm text-warning-700 mt-2">
                  Create a constitutional rights card for police encounters
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col items-center space-y-6">
                  {/* Enhanced ID Card Design */}
                  <div
                    ref={idCardRef}
                    className="w-full max-w-2xl p-8 sm:p-10 bg-white shadow-2xl rounded-2xl border-4 border-warning-500"
                  >
                    <div className="text-center space-y-6">
                      {/* Header with Badge */}
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="bg-warning-600 p-3 rounded-xl">
                          <Shield className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-warning-900 border-b-4 border-warning-500 pb-4">
                        Right to Remain Silent
                      </h2>

                      {/* Rights List */}
                      <div className="space-y-4 text-left bg-gradient-to-br from-warning-50 to-white p-6 rounded-xl border-2 border-warning-200">
                        <div className="flex items-start gap-3">
                          <div className="bg-warning-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">
                            1
                          </div>
                          <p className="text-base sm:text-lg font-bold text-secondary-900">
                            I DO NOT CONSENT TO A SEARCH
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-warning-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">
                            2
                          </div>
                          <p className="text-base sm:text-lg font-bold text-secondary-900">
                            I DO NOT WANT TO SPEAK TO POLICE
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-warning-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">
                            3
                          </div>
                          <p className="text-base sm:text-lg font-bold text-secondary-900">
                            I WANT TO SPEAK TO AN ATTORNEY
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-warning-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm">
                            4
                          </div>
                          <p className="text-base sm:text-lg font-bold text-secondary-900">
                            I DO NOT WANT TO SIGN ANYTHING
                          </p>
                        </div>
                      </div>

                      {/* Name Field */}
                      {state.plaintiffName && (
                        <div className="pt-4 border-t-2 border-warning-200">
                          <p className="text-base sm:text-lg font-semibold text-secondary-900">
                            Name: <span className="text-warning-900">{state.plaintiffName}</span>
                          </p>
                        </div>
                      )}

                      {/* Constitutional Notice */}
                      <div className="text-xs sm:text-sm space-y-2 bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                        <p className="font-semibold text-secondary-800">
                          This card asserts my constitutional rights under the Fourth, Fifth, and Sixth Amendments to the U.S. Constitution.
                        </p>
                        <p className="text-secondary-700">
                          I do not consent to any searches, and I invoke my right to remain silent and my right to legal counsel.
                        </p>
                      </div>

                      {/* Date */}
                      <div className="text-sm text-secondary-600 pt-2">
                        Generated: {fmtDate()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-2xl">
                    <Button
                      onClick={downloadIdCard}
                      className="min-h-[44px] bg-warning-600 hover:bg-warning-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadIdCardAsPdf}
                      className="min-h-[44px] border-warning-300 text-warning-700 hover:bg-warning-50 font-semibold"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!idCardRef.current) return;
                        copyToClipboard(idCardRef.current.innerText);
                      }}
                      className="min-h-[44px] border-primary-300 text-primary-700 hover:bg-primary-50 font-semibold"
                    >
                      <Copy className="mr-2 h-5 w-5" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                      className="min-h-[44px] border-secondary-300 text-secondary-700 hover:bg-secondary-50 font-semibold"
                    >
                      <Printer className="mr-2 h-5 w-5" />
                      Print
                    </Button>
                  </div>

                  {/* Helpful Note */}
                  <div className="w-full max-w-2xl p-4 sm:p-6 bg-primary-50 border border-primary-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-primary-900">
                        <p className="font-semibold mb-1">Pro Tip:</p>
                        <p className="text-primary-800">
                          Print this card, keep it in your wallet, and show it to law enforcement if needed. You can remain silent after presenting this card.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stop and ID Laws Tab */}
          <TabsContent value="stop-id" className="space-y-6 mt-6">
            <Card className="shadow-soft border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-secondary-50 to-secondary-100 border-b border-secondary-200 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-secondary-900">
                  <div className="bg-secondary-700 p-2 rounded-lg">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Stop and ID Laws
                </CardTitle>
                <p className="text-sm text-secondary-700 mt-2">
                  Learn about identification requirements during police encounters
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="grid gap-4 mb-6">
                  <Label htmlFor="selectedState" className="text-base font-semibold text-secondary-900">
                    Select State
                  </Label>
                  <Select
                    value={state.selectedState}
                    onValueChange={(value) => dispatch({ type: "set", key: "selectedState", value: value as StateCode })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {rightsForState ? (
                  <div className="space-y-4 p-4 sm:p-6 bg-gradient-to-br from-secondary-50 to-white rounded-xl border border-secondary-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-secondary-700 p-2 rounded-lg flex-shrink-0">
                        <Info className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-secondary-900 mb-2">
                          {rightsForState.title}
                        </h3>
                        <p className="text-base text-secondary-700 leading-relaxed">
                          {rightsForState.summary}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-secondary-200">
                      <p className="text-sm text-secondary-600 mb-3">
                        <span className="font-semibold">Legal Citation:</span> {rightsForState.citation}
                      </p>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.open(rightsForState.url, "_blank")}
                        className="min-h-[44px] w-full sm:w-auto border-secondary-300 text-secondary-700 hover:bg-secondary-50 font-medium"
                      >
                        <BookOpen className="mr-2 h-5 w-5" />
                        View Official Source
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 border-2 border-dashed border-secondary-300 rounded-xl bg-secondary-50 text-center">
                    <Info className="h-12 w-12 sm:h-16 sm:w-16 text-secondary-400 mx-auto mb-4" />
                    <p className="text-secondary-600 text-base sm:text-lg font-medium">
                      No state selected
                    </p>
                    <p className="text-secondary-500 text-sm mt-2">
                      Please select a state to view its stop and identification laws
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6 mt-6">
            <Card className="shadow-soft border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent-50 to-accent-100 border-b border-accent-200 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-accent-900">
                  <div className="bg-accent-600 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Legal Resources
                </CardTitle>
                <p className="text-sm text-accent-700 mt-2">
                  Comprehensive legal information and resources
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Public Records Laws */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200 hover:border-primary-400 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-primary-600 p-2 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-primary-900">Public Records Laws</h3>
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed">
                      Information about public records laws in each state, including how to request government documents and the timeframes for responses.
                    </p>
                  </div>

                  {/* Stop and ID Laws */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-secondary-50 to-white rounded-xl border-2 border-secondary-200 hover:border-secondary-400 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-secondary-700 p-2 rounded-lg flex-shrink-0">
                        <Info className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-secondary-900">Stop and ID Laws</h3>
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed">
                      Details about identification requirements during police encounters, including your rights and obligations in each state.
                    </p>
                  </div>

                  {/* Cannabis Laws */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-success-50 to-white rounded-xl border-2 border-success-200 hover:border-success-400 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-success-600 p-2 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-success-900">Cannabis Laws</h3>
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed">
                      Comprehensive information about marijuana laws in each state, including possession limits, cultivation rules, and legal status.
                    </p>
                  </div>

                  {/* Hostile States Information */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-danger-50 to-white rounded-xl border-2 border-danger-200 hover:border-danger-400 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-danger-600 p-2 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-danger-900">Hostile States Information</h3>
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed">
                      Information about states that are problematic for auditors and journalists, including specific restrictions and risks.
                    </p>
                  </div>

                  {/* Notice Requirements */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-warning-50 to-white rounded-xl border-2 border-warning-200 hover:border-warning-400 hover:shadow-md transition-all md:col-span-2">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-warning-600 p-2 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-warning-900">Notice Requirements</h3>
                    </div>
                    <p className="text-sm text-secondary-700 leading-relaxed">
                      State-specific notice requirements for legal actions against government entities, including required timeframes and procedures for filing claims.
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-4 sm:p-6 bg-secondary-50 border-l-4 border-secondary-400 rounded-r-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-secondary-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-secondary-800">
                      <p className="font-semibold mb-1">Important Disclaimer:</p>
                      <p>
                        This toolkit provides general legal information only and is not a substitute for professional legal advice.
                        Laws vary by jurisdiction and change frequently. Always consult with a qualified attorney for your specific situation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-secondary-800 to-secondary-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-secondary-300 text-sm">
              Legal Toolkit Pro v1.0.0 | Professional Legal Document Generation
            </p>
            <p className="text-secondary-400 text-xs mt-2">
              All content is for informational purposes only. Not legal advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
