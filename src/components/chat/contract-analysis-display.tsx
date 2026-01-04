import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, TrendingUp, DollarSign, Shield, FileText, Wrench, Briefcase, Scale, ClipboardCheck } from "lucide-react";

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
  required_skills: {
    summary: {
      total_skills: number;
      critical_skills: number;
      skills_gap_risk: string;
    };
    technical: Array<{
      name: string;
      category: string;
      proficiency: string;
      requirement_type: string;
      clause_reference: string;
      description: string;
      is_specialized: boolean;
      criticality: string;
    }>;
    business: Array<{
      name: string;
      category: string;
      proficiency: string;
      requirement_type: string;
      clause_reference: string;
      description: string;
      is_specialized: boolean;
      criticality: string;
    }>;
    legal: Array<{
      name: string;
      category: string;
      proficiency: string;
      requirement_type: string;
      clause_reference: string;
      description: string;
      is_specialized: boolean;
      criticality: string;
    }>;
    compliance: Array<{
      name: string;
      category: string;
      proficiency: string;
      requirement_type: string;
      clause_reference: string;
      description: string;
      certification_required: string;
      is_specialized: boolean;
      criticality: string;
    }>;
    skill_gaps: Array<{
      skill_name: string;
      gap_severity: string;
      mitigation_options: string;
      training_available: boolean;
      outsourcing_possible: boolean;
    }>;
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

  // Parse required skills
  const parseSkill = (skillEl: Element, includesCert = false) => {
    const base = {
      name: skillEl.querySelector("name")?.textContent?.trim() || "",
      category: skillEl.querySelector("category")?.textContent?.trim() || "",
      proficiency: skillEl.querySelector("proficiency_required")?.textContent?.trim() || "",
      requirement_type: skillEl.querySelector("requirement_type")?.textContent?.trim() || "",
      clause_reference: skillEl.querySelector("clause_reference")?.textContent?.trim() || "",
      description: skillEl.querySelector("description")?.textContent?.trim() || "",
      is_specialized: skillEl.querySelector("is_specialized")?.textContent?.trim()?.toLowerCase() === "true",
      criticality: skillEl.querySelector("criticality")?.textContent?.trim() || "",
    };
    if (includesCert) {
      return { ...base, certification_required: skillEl.querySelector("certification_required")?.textContent?.trim() || "" };
    }
    return base;
  };

  const required_skills = {
    summary: {
      total_skills: parseInt(getTextContent("skills_summary > total_skills_identified")) || 0,
      critical_skills: parseInt(getTextContent("skills_summary > critical_skills_count")) || 0,
      skills_gap_risk: getTextContent("skills_summary > skills_gap_risk"),
    },
    technical: Array.from(xmlDoc.querySelectorAll("technical_skills > skill")).map(s => parseSkill(s)) as ParsedAnalysis["required_skills"]["technical"],
    business: Array.from(xmlDoc.querySelectorAll("business_skills > skill")).map(s => parseSkill(s)) as ParsedAnalysis["required_skills"]["business"],
    legal: Array.from(xmlDoc.querySelectorAll("legal_skills > skill")).map(s => parseSkill(s)) as ParsedAnalysis["required_skills"]["legal"],
    compliance: Array.from(xmlDoc.querySelectorAll("compliance_skills > skill")).map(s => parseSkill(s, true)) as ParsedAnalysis["required_skills"]["compliance"],
    skill_gaps: Array.from(xmlDoc.querySelectorAll("skill_gaps > gap")).map(gap => ({
      skill_name: gap.querySelector("skill_name")?.textContent?.trim() || "",
      gap_severity: gap.querySelector("gap_severity")?.textContent?.trim() || "",
      mitigation_options: gap.querySelector("mitigation_options")?.textContent?.trim() || "",
      training_available: gap.querySelector("training_available")?.textContent?.trim()?.toLowerCase() === "true",
      outsourcing_possible: gap.querySelector("outsourcing_possible")?.textContent?.trim()?.toLowerCase() === "true",
    })),
  };

  return {
    metadata,
    executive_summary,
    key_terms,
    risk_breakdown,
    critical_issues,
    negotiation_strategy: { must_change, should_change },
    required_skills,
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

function getProficiencyColor(proficiency: string): string {
  switch (proficiency.toLowerCase()) {
    case "expert":
      return "bg-purple-500";
    case "advanced":
      return "bg-blue-500";
    case "intermediate":
      return "bg-green-500";
    case "basic":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
}

function getCriticalityVariant(criticality: string): "destructive" | "default" | "secondary" | "outline" {
  switch (criticality.toLowerCase()) {
    case "critical":
      return "destructive";
    case "important":
      return "default";
    case "nice-to-have":
      return "outline";
    default:
      return "secondary";
  }
}

function getSkillGapColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "hsl(var(--destructive))";
    case "high":
      return "hsl(var(--warning))";
    case "medium":
      return "hsl(var(--warning) / 0.6)";
    default:
      return "hsl(var(--muted-foreground))";
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

      {/* Required Skills */}
      {(data.required_skills.technical.length > 0 ||
        data.required_skills.business.length > 0 ||
        data.required_skills.legal.length > 0 ||
        data.required_skills.compliance.length > 0) && (
        <Accordion type="single" collapsible defaultValue="skills">
          <AccordionItem value="skills">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 font-semibold">
                <Wrench className="h-4 w-4" />
                Required Skills ({data.required_skills.summary.total_skills ||
                  (data.required_skills.technical.length +
                   data.required_skills.business.length +
                   data.required_skills.legal.length +
                   data.required_skills.compliance.length)})
                {data.required_skills.summary.skills_gap_risk && (
                  <Badge variant={getSeverityVariant(data.required_skills.summary.skills_gap_risk)} className="ml-2">
                    {data.required_skills.summary.skills_gap_risk} Gap Risk
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {/* Skills Summary */}
                {(data.required_skills.summary.total_skills > 0 || data.required_skills.summary.critical_skills > 0) && (
                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold">{data.required_skills.summary.total_skills}</div>
                      <div className="text-muted-foreground text-xs">Total Skills</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold text-destructive">{data.required_skills.summary.critical_skills}</div>
                      <div className="text-muted-foreground text-xs">Critical</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-2xl font-bold" style={{ color: getSkillGapColor(data.required_skills.summary.skills_gap_risk) }}>
                        {data.required_skills.summary.skills_gap_risk || "N/A"}
                      </div>
                      <div className="text-muted-foreground text-xs">Gap Risk</div>
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {data.required_skills.technical.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Wrench className="h-3 w-3" />
                      Technical Skills ({data.required_skills.technical.length})
                    </div>
                    <div className="space-y-2">
                      {data.required_skills.technical.map((skill, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {skill.name}
                              {skill.is_specialized && <Badge variant="outline" className="text-xs">Specialized</Badge>}
                            </div>
                            {skill.description && <div className="text-muted-foreground text-xs mt-1">{skill.description}</div>}
                            {skill.clause_reference && <div className="text-xs text-blue-500 mt-1">Ref: {skill.clause_reference}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getProficiencyColor(skill.proficiency)}>{skill.proficiency}</Badge>
                            <Badge variant={getCriticalityVariant(skill.criticality)}>{skill.criticality}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Skills */}
                {data.required_skills.business.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      Business Skills ({data.required_skills.business.length})
                    </div>
                    <div className="space-y-2">
                      {data.required_skills.business.map((skill, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {skill.name}
                              {skill.is_specialized && <Badge variant="outline" className="text-xs">Specialized</Badge>}
                            </div>
                            {skill.description && <div className="text-muted-foreground text-xs mt-1">{skill.description}</div>}
                            {skill.clause_reference && <div className="text-xs text-blue-500 mt-1">Ref: {skill.clause_reference}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getProficiencyColor(skill.proficiency)}>{skill.proficiency}</Badge>
                            <Badge variant={getCriticalityVariant(skill.criticality)}>{skill.criticality}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Skills */}
                {data.required_skills.legal.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Scale className="h-3 w-3" />
                      Legal Skills ({data.required_skills.legal.length})
                    </div>
                    <div className="space-y-2">
                      {data.required_skills.legal.map((skill, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {skill.name}
                              {skill.is_specialized && <Badge variant="outline" className="text-xs">Specialized</Badge>}
                            </div>
                            {skill.description && <div className="text-muted-foreground text-xs mt-1">{skill.description}</div>}
                            {skill.clause_reference && <div className="text-xs text-blue-500 mt-1">Ref: {skill.clause_reference}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getProficiencyColor(skill.proficiency)}>{skill.proficiency}</Badge>
                            <Badge variant={getCriticalityVariant(skill.criticality)}>{skill.criticality}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Skills */}
                {data.required_skills.compliance.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      <ClipboardCheck className="h-3 w-3" />
                      Compliance Skills ({data.required_skills.compliance.length})
                    </div>
                    <div className="space-y-2">
                      {data.required_skills.compliance.map((skill, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {skill.name}
                              {skill.is_specialized && <Badge variant="outline" className="text-xs">Specialized</Badge>}
                            </div>
                            {skill.description && <div className="text-muted-foreground text-xs mt-1">{skill.description}</div>}
                            {skill.certification_required && (
                              <div className="text-xs text-amber-600 mt-1">Cert Required: {skill.certification_required}</div>
                            )}
                            {skill.clause_reference && <div className="text-xs text-blue-500 mt-1">Ref: {skill.clause_reference}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getProficiencyColor(skill.proficiency)}>{skill.proficiency}</Badge>
                            <Badge variant={getCriticalityVariant(skill.criticality)}>{skill.criticality}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {data.required_skills.skill_gaps.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      Identified Skill Gaps ({data.required_skills.skill_gaps.length})
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Mitigation</TableHead>
                          <TableHead>Options</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.required_skills.skill_gaps.map((gap, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{gap.skill_name}</TableCell>
                            <TableCell>
                              <Badge variant={getSeverityVariant(gap.gap_severity)}>{gap.gap_severity}</Badge>
                            </TableCell>
                            <TableCell className="text-sm max-w-xs">{gap.mitigation_options}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {gap.training_available && <Badge variant="outline" className="text-xs">Training</Badge>}
                                {gap.outsourcing_possible && <Badge variant="outline" className="text-xs">Outsource</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

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
