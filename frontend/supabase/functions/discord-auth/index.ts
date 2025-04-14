
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID') || '';
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET') || '';
const REDIRECT_URI = Deno.env.get('DISCORD_REDIRECT_URI') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body and extract the code
    let code, error, error_description;
    
    // Check if code is passed in request body
    if (req.method === 'POST') {
      const body = await req.json();
      code = body.code;
    } else {
      // For backward compatibility, also check URL params
      const params = Object.fromEntries(
        new URL(req.url).searchParams.entries()
      );
      code = params.code;
      error = params.error;
      error_description = params.error_description;
    }

    if (error) {
      console.error('Discord auth error:', error, error_description);
      return new Response(
        JSON.stringify({ error, error_description }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'No code provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Error exchanging code for token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token', details: tokenData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { access_token } = tokenData;

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('Error fetching user data from Discord:', userData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data', details: userData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userData.id)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking for existing user:', userError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: userError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let userId = existingUser?.id;
    
    // If user doesn't exist, create them
    if (!existingUser) {
      // Determine avatar URL
      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` 
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`;
        
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          discord_id: userData.id,
          display_name: userData.username,
          avatar: avatarUrl,
          role: 'regular', // Default role
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating new user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: createError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      userId = newUser.id;
    }
    
    // Create a session for the user
    const { data: { session }, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId
    });
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session', details: sessionError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return session info
    return new Response(
      JSON.stringify({ 
        session,
        user: existingUser || { id: userId }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error in Discord auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
