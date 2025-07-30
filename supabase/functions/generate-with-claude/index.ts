import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId = null, userId = null, fileData = null } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    console.log(`Processing Claude request for user ${userId}, conversation ${conversationId || 'new'}`);
    console.log(`API Key present: ${!!ANTHROPIC_API_KEY}, starts with sk-ant-: ${ANTHROPIC_API_KEY?.startsWith('sk-ant-')}`);

    // Product information context
    const productContext = `
Bunting's product portfolio includes:
1. Magnetic separation equipment – drawer, grate and plate magnets, drum and pulley separators, and crossbelt or in-line suspended magnets for removing ferrous contamination from dry, wet or pneumatic flows.
2. Eddy current separators that automatically eject non-ferrous metals such as aluminium or copper in recycling and processing lines.
3. Metal detection systems – meTRON tunnel, gravity free-fall, pipeline/liquid detectors, and TN77 quarry belt units – for quality control and machinery protection.
4. Magnetic material-handling conveyors, including MagSlide®, standard-frame, belt-less chip and steel-belt models for transferring or elevating ferrous parts and scrap.
5. Wright Cylinders by Bunting – precision magnetic printing and die-cutting cylinders for flexo, offset, narrow-web and can-decorator presses.
6. SSSC® Stainless-Steel Separation Conveyor™ for recovering fragmented stainless and other weakly magnetic metals missed by conventional magnets.
7. Stock and custom permanent magnets (neodymium, ceramic, alnico, samarium-cobalt) and engineered magnetic assemblies built to OEM specifications.
8. Electromagnets with various coil voltages (12V, 24V, 48V, 120V, 240V), magnetic strengths up to 12,000 Gauss (1.2 Tesla), sizes ranging from 1 inch (25mm) to 12 inches (305mm) in diameter and 2 inches (50mm) to 24 inches (610mm) in length, with materials including copper, aluminum, and iron cores.
`;

    // Enhanced system message for document/vision analysis
    let systemMessage = `You are BuntingGPT, a helpful AI assistant with advanced vision and document analysis capabilities. You can discuss any topic and provide information on a wide range of subjects. Be helpful, informative, and conversational.

When analyzing documents, images, or files:
1. Provide thorough analysis of the content
2. Extract key information and insights
3. For PDFs: Perform OCR and text extraction as needed
4. For images: Describe visual elements, text, charts, diagrams
5. For documents: Summarize content, identify main points, extract data
6. Offer actionable insights and recommendations

After providing your answer, do one of the following:
1. Ask a relevant follow-up question to deepen the conversation if the topic has more depth to explore.
2. Ask if your answer addressed their question completely or if they need additional information.
3. Suggest related topics they might be interested in based on your query.

Keep follow-ups concise and natural - they should feel like a helpful colleague checking in, not an interrogation.

${productContext}`;

    // Prepare messages for Claude API format with file support
    const claudeMessages = messages.filter(msg => msg.role !== "system").map(msg => {
      // If this is the last message and we have file data, enhance it
      if (fileData && msg === messages[messages.length - 1]) {
        let content = [];
        
        // Add the text content
        content.push({
          type: "text",
          text: msg.content
        });
        
        // Process file data
        if (fileData.base64) {
          // Single file, not chunked
          const mediaType = fileData.type.startsWith('image/') ? fileData.type : "image/jpeg";
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: fileData.base64
            }
          });
        } else if (fileData.chunks) {
          // Chunked file - add a text description
          content.push({
            type: "text",
            text: `\n\n[File uploaded: ${fileData.name} (${fileData.type}, ${Math.round(fileData.size / 1024)}KB). File has been processed in ${fileData.chunks.length} chunks for analysis. Please analyze the entire document content.]`
          });
          
          // For chunked files, we'll process the first chunk as an image if it's an image type
          if (fileData.chunks.length > 0 && fileData.type.startsWith('image/')) {
            content.push({
              type: "image",
              source: {
                type: "base64",
                media_type: fileData.type,
                data: fileData.chunks[0]
              }
            });
          }
        }
        
        return {
          role: msg.role,
          content: content
        };
      }
      
      // Regular message without file
      return {
        role: msg.role,
        content: msg.content
      };
    });

    console.log("Sending to Claude API");

    // Call the Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ANTHROPIC_API_KEY}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: systemMessage,
        messages: claudeMessages,
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    let responseContent = data.content[0].text;
    
    // If file was processed, add processing info
    if (fileData) {
      const processingInfo = fileData.needsChunking 
        ? `\n\n---\n*Document processed in ${fileData.chunks?.length} chunks (${Math.round(fileData.size / 1024)}KB total)*`
        : `\n\n---\n*File analyzed: ${fileData.name} (${Math.round(fileData.size / 1024)}KB)*`;
      responseContent += processingInfo;
    }
    
    return new Response(JSON.stringify({
      content: responseContent,
      model: fileData ? "claude-3-5-sonnet (vision)" : "claude-3-5-sonnet"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in generate-with-claude function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});