import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, TrendingUp, DollarSign, Shield, FileText } from "lucide-react";

interface ContractAnalysisDisplayProps {
  analysis: string;
}

interface ParsedAnalysis {
  metadata: {
    po_number: string;
    customer_name: string;
    total_value: string;
    currency: string;
    risk_score: number;
    approval_tier: string;
  };
  executive_summary: {
    recommendation: string;
    business_impact: string;
    top_concerns: string[];
  };
  key_terms: {
    payment?: string;
    delivery?: string;
    warranty?: string;
    liability?: string;
  };
  risk_breakdown: {
    financial: number;
    operational: number;
    legal: number;
    compliance: number;
  };
  critical_issues: Array<{
    severity: string;
    category: string;
    description: string;
    exposure: string;
    action: string;
  }>;
  negotiation_strategy?: {
    must_change: string[];
    should_change: string[];
  };
}

function parseXML(xmlString: string): ParsedAnalysis {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const getTextContent = (selector: string): string => {
    return xmlDoc.querySelector(selector)?.textContent?.trim() || "";
  };

  const getNumber = (selector: string): number => {
    const text = getTextContent(selector);
    return parseFloat(text) || 0;
  };

  // Parse metadata
  const metadata = {
    po_number: getTextContent("po_number"),
    customer_name: getTextContent("customer_name"),
    total_value: getTextContent("total_value"),
    currency: getTextContent("currency"),
    risk_score: getNumber("metadata > risk_score"),
    approval_tier: getTextContent("approval_tier"),
  };

  // Parse executive summary
  const executive_summary = {
    recommendation: getTextContent("executive_summary > recommendation"),
    business_impact: getTextContent("business_impact"),
    top_concerns: Array.from(xmlDoc.querySelectorAll("top_3_concerns > concern")).map(
      (el) => el.textContent?.trim() || ""
    ),
  };

  // Parse key terms
  const key_terms = {
    payment: getTextContent("payment > terms"),
    delivery: getTextContent("delivery > date"),
    warranty: getTextContent("warranty > period"),
    liability: getTextContent("liability > cap"),
  };

  // Parse risk breakdown
  const risk_breakdown = {
    financial: getNumber("financial_risk[score]"),
    operational: getNumber("operational_risk[score]"),
    legal: getNumber("legal_risk[score]"),
    compliance: getNumber("compliance_risk[score]"),
  };

  // Parse critical issues
  const critical_issues = Array.from(xmlDoc.querySelectorAll("critical_issues > issue")).map((issue) => ({
    severity: issue.querySelector("severity")?.textContent?.trim() || "",
    category: issue.querySelector("category")?.textContent?.trim() || "",
    description: issue.querySelector("issue_description")?.textContent?.trim() || "",
    exposure: issue.querySelector("financial_exposure")?.textContent?.trim() || "",
    action: issue.querySelector("recommended_action")?.textContent?.trim() || "",
  }));

  // Parse negotiation strategy
  const must_change = Array.from(xmlDoc.querySelectorAll("must_change > item")).map(
    (item) => item.querySelector("clause")?.textContent?.trim() || ""
  );
  const should_change = Array.from(xmlDoc.querySelectorAll("should_change > item")).map(
    (item) => item.querySelector("clause")?.textContent?.trim() || ""
  );

  return {
    metadata,
    executive_summary,
    key_terms,
    risk_breakdown,
    critical_issues,
    negotiation_strategy: { must_change, should_change },
  };
}

function getRiskColor(score: number): string {
  if (score >= 80) return "hsl(var(--destructive))";
  if (score >= 60) return "hsl(var(--warning))";
  if (score >= 30) return "hsl(var(--warning) / 0.5)";
  return "hsl(var(--success))";
}

function getSeverityVariant(severity: string): "destructive" | "default" | "secondary" | "outline" {
  switch (severity.toLowerCase()) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
}

export function ContractAnalysisDisplay({ analysis }: ContractAnalysisDisplayProps) {
  const data = parseXML(analysis);

  return (
    <div className="space-y-4 w-full">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PO {data.metadata.po_number}
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="font-medium">{data.metadata.customer_name}</div>
                <div>
                  {data.metadata.total_value} {data.metadata.currency}
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="text-3xl font-bold" style={{ color: getRiskColor(data.metadata.risk_score) }}>
                {data.metadata.risk_score}
              </div>
              <Badge variant={getSeverityVariant(data.metadata.approval_tier)}>
                {data.metadata.approval_tier}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Accordion type="single" collapsible defaultValue="summary">
        <AccordionItem value="summary">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Executive Summary
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div>
                <span className="font-medium">Recommendation: </span>
                <Badge variant="outline">{data.executive_summary.recommendation}</Badge>
              </div>
              <p className="text-sm">{data.executive_summary.business_impact}</p>
              {data.executive_summary.top_concerns.length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2">Top Concerns:</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {data.executive_summary.top_concerns.map((concern, i) => (
                      <li key={i}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Key Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Key Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {data.key_terms.payment && (
              <div>
                <div className="text-muted-foreground">Payment</div>
                <div className="font-medium">{data.key_terms.payment}</div>
              </div>
            )}
            {data.key_terms.delivery && (
              <div>
                <div className="text-muted-foreground">Delivery</div>
                <div className="font-medium">{data.key_terms.delivery}</div>
              </div>
            )}
            {data.key_terms.warranty && (
              <div>
                <div className="text-muted-foreground">Warranty</div>
                <div className="font-medium">{data.key_terms.warranty}</div>
              </div>
            )}
            {data.key_terms.liability && (
              <div>
                <div className="text-muted-foreground">Liability</div>
                <div className="font-medium">{data.key_terms.liability}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risk Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Financial</span>
              <span className="font-medium">{data.risk_breakdown.financial}</span>
            </div>
            <Progress value={data.risk_breakdown.financial} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Operational</span>
              <span className="font-medium">{data.risk_breakdown.operational}</span>
            </div>
            <Progress value={data.risk_breakdown.operational} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Legal</span>
              <span className="font-medium">{data.risk_breakdown.legal}</span>
            </div>
            <Progress value={data.risk_breakdown.legal} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compliance</span>
              <span className="font-medium">{data.risk_breakdown.compliance}</span>
            </div>
            <Progress value={data.risk_breakdown.compliance} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {data.critical_issues.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="issues">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                Critical Issues ({data.critical_issues.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.critical_issues.map((issue, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant={getSeverityVariant(issue.severity)}>{issue.severity}</Badge>
                      </TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell className="max-w-xs">{issue.description}</TableCell>
                      <TableCell>{issue.exposure}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Negotiation Strategy */}
      {data.negotiation_strategy && (data.negotiation_strategy.must_change.length > 0 || data.negotiation_strategy.should_change.length > 0) && (
        <Accordion type="single" collapsible>
          <AccordionItem value="negotiation">
            <AccordionTrigger className="hover:no-underline">
              <div className="font-semibold">Negotiation Strategy</div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {data.negotiation_strategy.must_change.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge variant="destructive">Must Change</Badge>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {data.negotiation_strategy.must_change.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.negotiation_strategy.should_change.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Badge variant="default">Should Change</Badge>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {data.negotiation_strategy.should_change.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
