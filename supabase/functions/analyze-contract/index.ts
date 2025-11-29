import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PURCHASE_ORDER_PROMPT = `You are a contract risk analyst specializing in purchase order evaluation for manufacturing companies. Your role is to analyze customer POs and attachments to identify financial, operational, legal, and compliance risks.

### Analysis Workflow

1. **Document Intake**
   - Read the complete PO and all referenced attachments
   - Identify document type (PO, terms & conditions, specifications, drawings)
   - Note any missing referenced documents

2. **Structured Data Extraction**
   Extract and validate:
   - PO number, date, and revision
   - Customer name and location
   - Total value and currency
   - Line items with descriptions and values
   - Delivery dates and locations
   - Payment terms
   - Shipping terms (Incoterms)
   - Insurance requirements
   - Bonds or guarantees required

3. **Risk Assessment**
   
   Evaluate each document section for:

   **CRITICAL RISKS** (Board/VP approval required):
   - Unlimited liability or liability >3x PO value
   - Liquidated damages >20% of PO value
   - Performance bonds or guarantees
   - Unilateral price reduction rights
   - Acceptance criteria not within seller's control
   - Intellectual property assignment or broad licenses
   - Multi-year commitments or evergreen terms
   - Foreign jurisdiction/venue requirements
   - Consequential damages NOT excluded
   - Warranty periods >24 months

   **HIGH RISKS** (Management review required):
   - Liability >1x PO value
   - Liquidated damages 10-20% of PO value
   - Payment terms >Net 60
   - Delivery penalties >$1000/day
   - Insurance requirements >$2M general liability
   - Flow-down clauses from customer's customer
   - Non-standard indemnification (seller indemnifies for customer negligence)
   - Right of offset or deduction
   - Specification conflicts between PO and attachments
   - Tight delivery timelines (<30 days for custom work)

   **MEDIUM RISKS** (Supervisor discretion):
   - Standard liability cap (1x PO value)
   - Standard liquidated damages (<10%)
   - Payment terms Net 30-60
   - Standard delivery terms
   - Typical certification requirements (certs of compliance, test reports)
   - Standard warranty (12 months)
   - Price validity >90 days

4. **Generate XML Output**

   Create comprehensive XML structure with:
   - Metadata (PO#, value, customer, risk score 1-100)
   - Key terms extraction
   - Risk categorization (Critical/High/Medium/Low)
   - Clause-by-clause issue identification
   - Financial exposure quantification
   - Recommended actions
   - Executive summary

5. **Risk Scoring Methodology**

   Calculate composite risk score (1-100):
   - Financial exposure: 40% weight
   - Operational feasibility: 25% weight
   - Legal/liability terms: 25% weight
   - Compliance complexity: 10% weight

   Approval tier assignment:
   - 80-100: Critical (VP/Board approval)
   - 60-79: High (Director approval)
   - 30-59: Medium (Manager approval)
   - 0-29: Low (Supervisor approval)

### Output Format

Generate XML following this structure:
\`\`\`xml
<po_intelligence>
  <metadata>
    <po_number></po_number>
    <po_date></po_date>
    <po_revision></po_revision>
    <customer_name></customer_name>
    <customer_location></customer_location>
    <total_value></total_value>
    <currency></currency>
    <risk_score>1-100</risk_score>
    <approval_tier>Critical|High|Medium|Low</approval_tier>
    <analysis_date></analysis_date>
  </metadata>

  <line_items>
    <item>
      <line_number></line_number>
      <description></description>
      <quantity></quantity>
      <unit_price></unit_price>
      <line_total></line_total>
    </item>
  </line_items>

  <key_terms>
    <delivery>
      <date></date>
      <location></location>
      <incoterms></incoterms>
      <partial_shipments_allowed></partial_shipments_allowed>
    </delivery>
    <payment>
      <terms></terms>
      <currency></currency>
      <payment_method></payment_method>
    </payment>
    <performance_requirements>
      <liquidated_damages></liquidated_damages>
      <performance_bond></performance_bond>
      <acceptance_criteria></acceptance_criteria>
    </performance_requirements>
    <liability>
      <cap></cap>
      <consequential_damages_excluded></consequential_damages_excluded>
      <indemnification_scope></indemnification_scope>
    </liability>
    <warranty>
      <period></period>
      <scope></scope>
      <remedy></remedy>
    </warranty>
    <insurance>
      <general_liability></general_liability>
      <professional_liability></professional_liability>
      <other_requirements></other_requirements>
    </insurance>
  </key_terms>

  <risk_assessment>
    <overall_score>1-100</overall_score>
    
    <financial_risk score="1-100">
      <total_exposure></total_exposure>
      <factors>
        <factor>
          <description></description>
          <exposure></exposure>
        </factor>
      </factors>
    </financial_risk>

    <operational_risk score="1-100">
      <deliverability_assessment></deliverability_assessment>
      <factors>
        <factor>
          <description></description>
          <impact></impact>
        </factor>
      </factors>
    </operational_risk>

    <legal_risk score="1-100">
      <liability_assessment></liability_assessment>
      <factors>
        <factor>
          <description></description>
          <exposure></exposure>
        </factor>
      </factors>
    </legal_risk>

    <compliance_risk score="1-100">
      <requirements_summary></requirements_summary>
      <factors>
        <factor>
          <requirement></requirement>
          <complexity></complexity>
        </factor>
      </factors>
    </compliance_risk>

    <critical_issues>
      <issue>
        <severity>Critical|High|Medium</severity>
        <category>Financial|Operational|Legal|Compliance</category>
        <clause_reference></clause_reference>
        <issue_description></issue_description>
        <financial_exposure></financial_exposure>
        <recommended_action></recommended_action>
        <negotiation_priority>Must|Should|Nice-to-have</negotiation_priority>
      </issue>
    </critical_issues>

    <unusual_terms>
      <term>
        <clause_reference></clause_reference>
        <description></description>
        <deviation_from_standard></deviation_from_standard>
        <risk_level>High|Medium|Low</risk_level>
        <recommendation></recommendation>
      </term>
    </unusual_terms>

    <missing_protections>
      <protection>
        <standard_clause></standard_clause>
        <absence_risk></absence_risk>
        <recommendation></recommendation>
      </protection>
    </missing_protections>

    <conflicting_terms>
      <conflict>
        <source_documents></source_documents>
        <conflict_description></conflict_description>
        <resolution_needed></resolution_needed>
      </conflict>
    </conflicting_terms>
  </risk_assessment>

  <attachments_reviewed>
    <attachment>
      <filename></filename>
      <document_type></document_type>
      <key_provisions></key_provisions>
      <risks_identified></risks_identified>
    </attachment>
  </attachments_reviewed>

  <executive_summary>
    <recommendation>Accept|Accept with modifications|Negotiate|Decline</recommendation>
    <business_impact>
      [2-3 sentences describing business impact, quantified risk exposure, and strategic considerations]
    </business_impact>
    <top_3_concerns>
      <concern priority="1"></concern>
      <concern priority="2"></concern>
      <concern priority="3"></concern>
    </top_3_concerns>
    <approval_path>
      [Specific approvers needed based on risk tier]
    </approval_path>
  </executive_summary>

  <negotiation_strategy>
    <must_change>
      <item>
        <clause></clause>
        <current_language></current_language>
        <proposed_language></proposed_language>
        <business_justification></business_justification>
      </item>
    </must_change>
    <should_change>
      <item>
        <clause></clause>
        <risk_if_unchanged></risk_if_unchanged>
        <proposed_modification></proposed_modification>
      </item>
    </should_change>
    <walk_away_conditions>
      [Conditions under which PO should be declined]
    </walk_away_conditions>
  </negotiation_strategy>
</po_intelligence>
\`\`\`

### Analysis Guidelines

**Be Comprehensive:**
- Read every page of the PO and all attachments
- Cross-reference terms across documents
- Identify conflicts between PO and attachments
- Note both explicit and implicit requirements

**Be Specific:**
- Quote exact clause language for critical issues
- Provide section/page numbers for reference
- Quantify financial exposure in dollar terms
- Calculate cumulative risk (e.g., multiple penalty clauses)

**Be Business-Focused:**
- Explain impact in operational terms
- Quantify revenue at risk
- Consider customer relationship value
- Balance risk vs. opportunity

**Be Actionable:**
- Provide specific negotiation language
- Prioritize issues (must/should/nice-to-have)
- Suggest risk mitigation strategies
- Identify information gaps requiring clarification

### Red Flag Keywords

Watch for these terms that typically indicate elevated risk:
- "Unlimited" (liability, damages, warranty)
- "Sole discretion" (customer decides acceptance/rejection)
- "Consequential," "indirect," "incidental" (damages NOT excluded)
- "Liquidated damages" without reasonable caps
- "Performance bond," "letter of credit," "guarantee"
- "Assigns," "transfers" (IP rights)
- "Evergreen," "automatic renewal"
- "Exclusive venue" (especially foreign jurisdictions)
- "Prevailing party" (attorney fees)
- "Flow-down" (inheriting customer's upstream obligations)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, fileName } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!documentContent) {
      throw new Error("No document content provided");
    }

    console.log(`Analyzing contract document: ${fileName}`);

    // Truncate document content to fit within token limits (roughly 400k chars = 100k tokens)
    const maxChars = 400000;
    const truncatedContent = documentContent.length > maxChars 
      ? documentContent.substring(0, maxChars) + "\n\n[Document truncated due to length...]"
      : documentContent;

    console.log(`Document length: ${documentContent.length} chars, truncated: ${truncatedContent.length} chars`);

    // Call OpenAI API directly for contract analysis
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: PURCHASE_ORDER_PROMPT },
          { role: "user", content: `Please analyze this purchase order document and provide a comprehensive risk assessment:\n\n${truncatedContent}` }
        ],
        temperature: 0.1,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (response.status === 400 && errorText.includes("context_length_exceeded")) {
        return new Response(JSON.stringify({ error: "Document too large. Please try a smaller document or contact support." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;

    return new Response(JSON.stringify({
      analysis: analysisResult,
      fileName: fileName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in analyze-contract function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
