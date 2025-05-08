
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Define CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract job numbers from the query string
function extractJobNumbers(query: string): string[] {
  const jobNumberPattern = /\b\d{7}(?:-\d+(?:-\d+)?)?\b/g;
  return [...query.matchAll(jobNumberPattern)].map(match => match[0]);
}

// Function to extract part numbers from the query string
function extractPartNumbers(query: string): string[] {
  const partNumberPattern = /\b\d{7}(?:-[A-Z0-9-]+)?\b/g;
  let matches = [...query.matchAll(partNumberPattern)].map(match => match[0]);
  
  // Filter out job numbers to avoid confusion
  const jobNumbers = extractJobNumbers(query);
  matches = matches.filter(match => !jobNumbers.includes(match));
  
  return matches;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the query string from the request body
    const { query } = await req.json();
    console.log("Processing whereisit query:", query);
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query string is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract job numbers and part numbers from the query
    const jobNumbers = extractJobNumbers(query);
    const partNumbers = extractPartNumbers(query);
    
    console.log("Extracted job numbers:", jobNumbers);
    console.log("Extracted part numbers:", partNumbers);

    // Get a list of all tables starting with "baq_"
    const { data: tables, error: tablesError } = await supabaseClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .like("table_name", "baq\\_%");
    
    if (tablesError) {
      console.error("Error fetching tables:", tablesError);
      return new Response(
        JSON.stringify({ error: "Failed to query database tables" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const baqTables = tables.map(t => t.table_name);
    console.log("Found BAQ tables:", baqTables);

    // Initialize response data
    const response = {
      jobs: [],
      count: 0,
      summary: "",
    };

    // Search for job numbers or part numbers in all BAQ tables
    if (jobNumbers.length > 0 || partNumbers.length > 0) {
      let allResults = [];
      
      // Search through all BAQ tables
      for (const table of baqTables) {
        try {
          // Check if the table has the relevant columns
          const { data: columns } = await supabaseClient
            .from("information_schema.columns")
            .select("column_name")
            .eq("table_schema", "public")
            .eq("table_name", table);
          
          const columnNames = columns.map(c => c.column_name.toLowerCase());
          
          // Skip tables that don't have the necessary columns
          // We look for columns that might contain job numbers or part numbers
          const relevantColumns = ['jobnumber', 'job', 'job_number', 'part', 'partnumber', 'part_number', 'id', 'number'];
          const hasRelevantColumns = relevantColumns.some(col => columnNames.includes(col.toLowerCase()));
          
          if (!hasRelevantColumns) {
            continue;
          }
          
          let query = supabaseClient.from(table).select('*');

          // Modify query based on job numbers or part numbers
          if (jobNumbers.length > 0) {
            // Try different possible column names for job numbers
            for (const jobNum of jobNumbers) {
              if (columnNames.includes('jobnumber')) {
                query = query.or(`jobnumber.eq.${jobNum},jobnumber.ilike.${jobNum}%`);
              } else if (columnNames.includes('job_number')) {
                query = query.or(`job_number.eq.${jobNum},job_number.ilike.${jobNum}%`);
              } else if (columnNames.includes('job')) {
                query = query.or(`job.eq.${jobNum},job.ilike.${jobNum}%`);
              }
            }
          }
          
          if (partNumbers.length > 0) {
            // Try different possible column names for part numbers
            for (const partNum of partNumbers) {
              if (columnNames.includes('partnumber')) {
                query = query.or(`partnumber.eq.${partNum},partnumber.ilike.${partNum}%`);
              } else if (columnNames.includes('part_number')) {
                query = query.or(`part_number.eq.${partNum},part_number.ilike.${partNum}%`);
              } else if (columnNames.includes('part')) {
                query = query.or(`part.eq.${partNum},part.ilike.${partNum}%`);
              }
            }
          }
          
          // Execute the query
          const { data, error } = await query.limit(10);
          
          if (error) {
            console.error(`Error querying table ${table}:`, error);
            continue;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} results in ${table}`);
            allResults = [...allResults, ...data.map(item => ({ ...item, _source_table: table }))];
          }
        } catch (err) {
          console.error(`Error processing table ${table}:`, err);
        }
      }
      
      // Process the results
      if (allResults.length > 0) {
        // Try to identify common fields across results and standardize the response
        const processedJobs = allResults.map(result => {
          // Try to extract common fields with different possible column names
          const jobNumber = result.jobnumber || result.job_number || result.job || '';
          const partNumber = result.partnumber || result.part_number || result.part || '';
          const customer = result.customer || result.customer_name || result.customername || '';
          const description = result.description || result.desc || '';
          const status = result.status || result.job_status || result.jobstatus || '';
          const location = result.location || result.current_location || result.currentlocation || '';
          const dueDate = result.due_date || result.duedate || '';
          const startDate = result.start_date || result.startdate || '';
          
          return {
            jobNumber,
            partNumber,
            customer,
            description,
            status,
            currentLocation: location,
            dueDate,
            startDate,
            sourceTable: result._source_table,
            rawData: result
          };
        });
        
        response.jobs = processedJobs;
        response.count = processedJobs.length;
        
        // Add customer if consistent across results
        if (processedJobs.every(job => job.customer === processedJobs[0].customer) && processedJobs[0].customer) {
          response.customer = processedJobs[0].customer;
        }
        
        // Create a summary of the jobs
        let summary = `Found ${processedJobs.length} job${processedJobs.length > 1 ? 's' : ''} matching your query:\n\n`;
        
        processedJobs.forEach((job, index) => {
          summary += `**${index + 1}. Job ${job.jobNumber || 'Unknown'}**\n`;
          if (job.partNumber) summary += `- Part: ${job.partNumber}\n`;
          if (job.customer) summary += `- Customer: ${job.customer}\n`;
          if (job.description) summary += `- Description: ${job.description}\n`;
          if (job.status) summary += `- Status: ${job.status}\n`;
          if (job.currentLocation) summary += `- Current Location: ${job.currentLocation}\n`;
          if (job.dueDate) summary += `- Due: ${job.dueDate}\n`;
          if (job.startDate) summary += `- Start: ${job.startDate}\n`;
          summary += '\n';
        });
        
        response.summary = summary;
      } else {
        response.summary = "No matching jobs found in the database.";
      }
    } else {
      // If no job or part numbers found, try to interpret the query as a natural language question
      // For now, return a simple response
      response.summary = "I couldn't find any specific job or part numbers in your query. Please include a job number (e.g., 8631077) or part number in your question.";
    }
    
    // Return the response
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in whereisit function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
