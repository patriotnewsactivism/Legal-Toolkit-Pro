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
import { Copy, Download, FileText, IdCard, Printer, RefreshCw, AlertTriangle, Info } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Legal Toolkit Pro</h1>
        <Badge variant="secondary">Version 1.0.0</Badge>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="cannabis">Cannabis Laws</TabsTrigger>
          <TabsTrigger value="id-card">ID Card</TabsTrigger>
          <TabsTrigger value="stop-id">Stop & ID</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Document Generation Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Legal Document Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={state.documentType}
                  onValueChange={(value) => dispatch({ type: "set", key: "documentType", value })}
                >
                  <SelectTrigger>
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

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="agency">Agency</Label>
                <Input
                  id="agency"
                  value={state.agency}
                  onChange={(e) => dispatch({ type: "set", key: "agency", value: e.target.value })}
                  placeholder="e.g., Department of Justice"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  value={state.jurisdiction}
                  onChange={(e) => dispatch({ type: "set", key: "jurisdiction", value: e.target.value })}
                  placeholder="e.g., Federal, State of California"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="incident">Incident Description</Label>
                <Textarea
                  id="incident"
                  value={state.incident}
                  onChange={(e) => dispatch({ type: "set", key: "incident", value: e.target.value })}
                  placeholder="Describe the incident or records requested"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={state.recipient}
                  onChange={(e) => dispatch({ type: "set", key: "recipient", value: e.target.value })}
                  placeholder="e.g., Person or organization name"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="damages">Damages</Label>
                <Textarea
                  id="damages"
                  value={state.damages}
                  onChange={(e) => dispatch({ type: "set", key: "damages", value: e.target.value })}
                  placeholder="Describe any damages suffered"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="plaintiffName">Your Name</Label>
                <Input
                  id="plaintiffName"
                  value={state.plaintiffName}
                  onChange={(e) => dispatch({ type: "set", key: "plaintiffName", value: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="defendantName">Defendant Name</Label>
                <Input
                  id="defendantName"
                  value={state.defendantName}
                  onChange={(e) => dispatch({ type: "set", key: "defendantName", value: e.target.value })}
                  placeholder="Defendant's name"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  value={state.caseNumber}
                  onChange={(e) => dispatch({ type: "set", key: "caseNumber", value: e.target.value })}
                  placeholder="Case number (if applicable)"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="courtName">Court Name</Label>
                <Input
                  id="courtName"
                  value={state.courtName}
                  onChange={(e) => dispatch({ type: "set", key: "courtName", value: e.target.value })}
                  placeholder="Court name (if applicable)"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={generateDocument}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(state.generated)}
                  disabled={!state.generated}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadText("legal-document.txt", state.generated)}
                  disabled={!state.generated}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download as Text
                </Button>
              </div>

              {state.generated && (
                <div className="mt-4 p-4 border rounded-md bg-muted">
                  <pre className="whitespace-pre-wrap">{state.generated}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cannabis Laws Tab */}
        <TabsContent value="cannabis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Cannabis Laws Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-1.5 mb-4">
                <Label htmlFor="selectedState">Select State</Label>
                <Select
                  value={state.selectedState}
                  onValueChange={(value) => dispatch({ type: "set", key: "selectedState", value: value as StateCode })}
                >
                  <SelectTrigger>
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
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{cannabisForState.title}</p>
                  <p className="text-sm">{cannabisForState.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    Legal Citation: {cannabisForState.citation}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(cannabisForState.url, "_blank")}
                  >
                    View Source
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a state to view its marijuana/cannabis laws.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ID Card Tab */}
        <TabsContent value="id-card">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                ID Rights Card Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div
                  ref={idCardRef}
                  className="w-full max-w-md p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white text-black"
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold">RIGHT TO REMAIN SILENT</h2>
                    <div className="space-y-2 text-sm">
                      <p>I DO NOT CONSENT TO A SEARCH</p>
                      <p>I DO NOT WANT TO SPEAK TO POLICE</p>
                      <p>I WANT TO SPEAK TO AN ATTORNEY</p>
                      <p>I DO NOT WANT TO SIGN ANYTHING</p>
                    </div>
                    {state.plaintiffName && (
                      <p className="text-sm">Name: {state.plaintiffName}</p>
                    )}
                    <div className="text-xs space-y-1">
                      <p>This card asserts my constitutional rights under the</p>
                      <p>Fourth, Fifth, and Sixth Amendments to the U.S. Constitution.</p>
                      <p>I do not consent to any searches, and I invoke my</p>
                      <p>right to remain silent and my right to legal counsel.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadIdCard}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                  <Button variant="outline" onClick={downloadIdCardAsPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!idCardRef.current) return;
                      copyToClipboard(idCardRef.current.innerText);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Text
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stop and ID Laws Tab */}
        <TabsContent value="stop-id" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Stop and ID Laws
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-1.5 mb-4">
                <Label htmlFor="selectedState">Select State</Label>
                <Select
                  value={state.selectedState}
                  onValueChange={(value) => dispatch({ type: "set", key: "selectedState", value: value as StateCode })}
                >
                  <SelectTrigger>
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
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{rightsForState.title}</p>
                  <p className="text-sm">{rightsForState.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    Legal Citation: {rightsForState.citation}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(rightsForState.url, "_blank")}
                  >
                    View Source
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a state to view its stop and identification laws.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Legal Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Public Records Laws</h3>
                  <p className="text-sm text-muted-foreground">
                    Information about public records laws in each state
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Stop and ID Laws</h3>
                  <p className="text-sm text-muted-foreground">
                    Details about identification requirements during police encounters
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Cannabis Laws</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive information about marijuana laws in each state
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Hostile States Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Information about states that are problematic for auditors and journalists
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Notice Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    State-specific notice requirements for legal actions against government entities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}