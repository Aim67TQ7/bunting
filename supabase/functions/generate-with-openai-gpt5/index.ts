import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId = null, userId = null, fileData = null, fileDataList = null, smart = false } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log(`Processing GPT-5 mini request for user ${userId}, conversation ${conversationId || 'new'}`);

    // System message - adapt if smart mode
    const systemBase = "You are a helpful, concise assistant. Respond clearly and accurately.";
    const smartAddon = " When given multiple attachments, triage them: select up to 5 most relevant for deep evaluation and provide concise summaries for the rest. Always return a single, well-structured answer with sections: Overview, Deep Evaluation (per top files), Summaries (others), Action Items. Never echo raw base64.";
    const systemMessage = {
      role: "system",
      content: smart ? systemBase + smartAddon : systemBase + " If a base64 file preview is provided, use its content as reference but do not echo the base64 back. If preview is truncated, note limitations and ask for clarification if necessary."
    } as const;

    const attachmentMessages: any[] = [];
    if (fileDataList && Array.isArray(fileDataList) && fileDataList.length > 0) {
      // Build a single compact attachment message
      const header = `User attached ${fileDataList.length} file(s). Previews may be truncated.`;
      const blocks = fileDataList.map((f: any, idx: number) => {
        const meta = `#${idx + 1}: ${f.name || 'file'} (${f.type || 'unknown'}, ${f.size || 0} bytes)${f.truncated ? ' [TRUNCATED PREVIEW]' : ''}`;
        const preview = f.base64Preview ? `\n--- BEGIN PREVIEW ---\n${f.base64Preview}\n--- END PREVIEW ---` : '';
        return `${meta}${preview}`;
      }).join("\n\n");
      attachmentMessages.push({ role: 'user', content: `${header}\n\n${blocks}` });
    } else if (fileData && (fileData.base64Preview || fileData.truncated)) {
      const header = `User attached a file: ${fileData.name || 'file'} (${fileData.type || 'unknown'}, ${fileData.size || 0} bytes). ${fileData.truncated ? 'Only a PREVIEW of the base64 content is provided below.' : 'A base64 preview is provided below.'}`;
      const previewBlock = fileData.base64Preview ? `\n\n--- BEGIN BASE64 PREVIEW ---\n${fileData.base64Preview}\n--- END BASE64 PREVIEW ---` : '';
      attachmentMessages.push({ role: 'user', content: `${header}${previewBlock}` });
    }

    const messagesWithSystem = [systemMessage, ...attachmentMessages, ...messages.filter((m: any) => m.role !== 'system')];

    // Helper to call OpenAI with robust token param handling
    const callOpenAI = async (model: string, maxTokens: number) => {
      const makeReq = async (param: 'max_completion_tokens' | 'max_tokens') => {
        const body: any = {
          model,
          messages: messagesWithSystem,
        };
        // GPT-5 and newer models don't support temperature parameter
        // Only add temperature for legacy models
        if (!model.includes('gpt-5') && !model.includes('o3') && !model.includes('o4')) {
          body.temperature = 0.2;
        }
        body[param] = maxTokens;
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        const text = await res.text();
        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch (_) {}
        return { ok: res.ok, status: res.status, json, text };
      };

      // First try with max_completion_tokens, then fall back to max_tokens if needed
      let attempt = await makeReq('max_completion_tokens');
      const msg = attempt.json?.error?.message || attempt.text || '';
      if (!attempt.ok && /max_completion_tokens/i.test(msg)) {
        console.log('Retrying with max_tokens param');
        attempt = await makeReq('max_tokens');
      } else if (!attempt.ok && /max_tokens/i.test(msg)) {
        console.log('Retrying with max_completion_tokens param');
        attempt = await makeReq('max_completion_tokens');
      }
      return attempt;
    };

    // Attempt primary model first
    const primaryModel = "gpt-5-mini-2025-08-07";
    const primaryMax = 8192; // safe cap; real 4,000,000-token contexts are not supported by OpenAI
    let attempt = await callOpenAI(primaryModel, primaryMax);

    // If primary fails due to unsupported model/params, fall back to a known-good model
    if (!attempt.ok) {
      const errMsg = attempt.json?.error?.message || attempt.text || "Unknown error";
      console.error("Primary model failed:", errMsg);
      const looksLikeUnsupportedModel = /model|unsupported|does not exist|unknown/i.test(errMsg);
      const fallbackModel = "gpt-4.1-2025-04-14"; // recommended default per platform docs
      if (looksLikeUnsupportedModel) {
        console.log(`Falling back to ${fallbackModel}`);
        attempt = await callOpenAI(fallbackModel, 8192);
      }
    }

    if (!attempt.ok) {
      console.error('OpenAI error payload:', attempt.json || attempt.text);
      const message = attempt.json?.error?.message || attempt.text || `HTTP ${attempt.status}`;
      throw new Error(`OpenAI API error: ${message}`);
    }

    const data = attempt.json;

    return new Response(JSON.stringify({
      content: data?.choices?.[0]?.message?.content ?? "",
      model: data?.model || primaryModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Error in generate-with-openai-gpt5 function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
