
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID') || '';
const DISCORD_REDIRECT_URI = Deno.env.get('DISCORD_REDIRECT_URI') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // For debugging purposes, log the environment variables
    console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID);
    console.log('DISCORD_REDIRECT_URI:', DISCORD_REDIRECT_URI);
    
    // Create Discord OAuth URL using the environment variable
    const scope = 'identify+guilds';
    const discordUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&scope=${scope}`;
    
    // Also log the final URL for debugging
    console.log('Final Discord URL:', discordUrl);
    
    return new Response(
      JSON.stringify({ url: discordUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error generating Discord OAuth URL:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
