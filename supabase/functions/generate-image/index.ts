import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId = null } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error("A text prompt is required for image generation");
    }

    console.log(`Processing image generation request for user ${userId}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    // Call OpenAI's image generation API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Image API error:", errorText);
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
      } catch (e) {
        errorMessage = errorText;
      }
      throw new Error(`OpenAI Image API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    
    // Get the base64 image data
    const imageBase64 = data.data?.[0]?.b64_json;
    
    if (!imageBase64) {
      throw new Error("No image was generated");
    }

    console.log("Image generated successfully");

    return new Response(JSON.stringify({
      content: `![Generated Image](data:image/png;base64,${imageBase64})`,
      imageBase64: imageBase64,
      model: "gpt-image-1"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in generate-image function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
