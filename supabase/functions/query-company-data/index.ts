
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log("Received company query:", query);

    // Get all tables that start with baq_
    const { data: tableData, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .like('tablename', 'baq_%');
    
    if (tableError) {
      throw new Error(`Error fetching tables: ${tableError.message}`);
    }
    
    console.log("Found BAQ tables:", tableData);
    
    if (!tableData || tableData.length === 0) {
      return new Response(
        JSON.stringify({ message: "No company data tables found" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Split query into words for searching
    const searchTerms = query.toLowerCase().split(/\s+/);
    let results = [];
    
    // Search through each BAQ table
    for (const table of tableData) {
      const tableName = table.tablename;
      
      try {
        // Get column names for the table
        const { data: columnData, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);
        
        if (columnError) {
          console.error(`Error fetching columns for ${tableName}: ${columnError.message}`);
          continue;
        }
        
        // If we have columns, search through the table
        if (columnData && columnData.length > 0) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) {
            console.error(`Error searching in ${tableName}: ${error.message}`);
            continue;
          }
          
          if (data && data.length > 0) {
            // Filter data based on search terms
            const matchingRows = data.filter(row => {
              return searchTerms.some(term => {
                return Object.values(row).some(value => 
                  value !== null && 
                  value.toString().toLowerCase().includes(term)
                );
              });
            });
            
            if (matchingRows.length > 0) {
              results.push({
                table: tableName,
                data: matchingRows
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error processing table ${tableName}: ${err.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in query-company-data function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
