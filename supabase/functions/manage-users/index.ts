import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Client strictly for Admin privileges (Service Role)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      throw new Error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY secret is not set in Edge Function Secrets!');
    }
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    // Initialize regular client to verify the caller's JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is entirely missing from the POST request.');
    }
    const jwtToken = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. VERIFY CALLER JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwtToken);
    
    if (authError || !user) {
      throw new Error(`Unauthorized. JWT Token verification failed. Detail: ${authError?.message}`);
    }

    // 2. VERIFY ADMIN ROLE FROM "user_roles"
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error(`Forbidden - Você não tem privilégios de Administrador. Contacte o suporte. Detail: ${roleError?.message || 'Role não é admin'}`);
    }

    // 3. EXECUTE THE REQUESTED ACTION
    const body = await req.json();
    const { action, payload } = body;

    let result;

    if (action === 'LIST_USERS') {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      result = data.users;
    } 
    else if (action === 'CREATE_USER') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
      });
      if (error) throw error;
      result = data.user;
    } 
    else if (action === 'UPDATE_USER') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        payload.userId,
        { password: payload.password, email: payload.email }
      );
      if (error) throw error;
      result = data.user;
    } 
    else if (action === 'DELETE_USER') {
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(
        payload.userId
      );
      if (error) throw error;
      // also cleanup the role manually if needed
      await supabaseAdmin.from('user_roles').delete().eq('id', payload.userId);
      result = { deleted: true };
    } 
    else {
      throw new Error('Atalho Invalido / Invalid Action Name');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
