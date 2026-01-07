import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default PIN for QR code signup - stored hashed
const DEFAULT_PIN = '2034155';

// Simple hash function for PINs and verification codes
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask email for display (j***@domain.com)
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, badgeNumber, pin, otp, newPin } = body;

    console.log(`[badge-auth] Action: ${action}, Badge: ${badgeNumber}`);

    // =============================================================================
    // LOOKUP - Check if badge exists and return employee info
    // =============================================================================
    if (action === 'lookup') {
      if (!badgeNumber) {
        return new Response(JSON.stringify({ error: 'Badge number is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Look up employee by badge number
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, name_first, name_last, user_id, badge_pin_hash, badge_pin_is_default, reports_to, user_email')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError) {
        console.error('[badge-auth] DB error:', empError);
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!employee) {
        return new Response(JSON.stringify({ 
          exists: false, 
          error: 'Badge number not found. Please contact HR if you believe this is an error.' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get supervisor email for OTP
      let supervisorEmail = null;
      if (employee.reports_to) {
        const { data: supervisor } = await supabase
          .from('employees')
          .select('user_email')
          .eq('id', employee.reports_to)
          .maybeSingle();
        supervisorEmail = supervisor?.user_email;
      }

      return new Response(JSON.stringify({
        exists: true,
        hasAccount: !!employee.user_id && !!employee.badge_pin_hash,
        employeeName: `${employee.name_first} ${employee.name_last}`,
        supervisorEmail: supervisorEmail ? maskEmail(supervisorEmail) : null,
        requiresPinChange: employee.badge_pin_is_default === true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // QUICK-SIGNUP - Create account with default PIN (from QR code)
    // =============================================================================
    if (action === 'quick-signup') {
      if (!badgeNumber || !pin) {
        return new Response(JSON.stringify({ error: 'Badge number and PIN are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify this is the default PIN
      if (pin !== DEFAULT_PIN) {
        return new Response(JSON.stringify({ error: 'Invalid signup code. Please scan the QR code again.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, name_first, name_last, user_id, badge_pin_hash')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already has account
      if (employee.user_id && employee.badge_pin_hash) {
        return new Response(JSON.stringify({ error: 'Account already exists. Please use login instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create synthetic email and auth user
      const syntheticEmail = `badge_${badgeNumber}@internal.buntingmagnetics.com`;
      const tempPassword = crypto.randomUUID(); // Random password, user will use PIN

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: syntheticEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          badge_number: badgeNumber,
          full_name: `${employee.name_first} ${employee.name_last}`,
        },
      });

      if (authError) {
        console.error('[badge-auth] Auth user creation failed:', authError);
        return new Response(JSON.stringify({ error: 'Failed to create account. Please try again.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Hash and store default PIN, link user_id, mark as default
      const pinHash = await hashString(pin);
      await supabase
        .from('employees')
        .update({
          user_id: authData.user.id,
          badge_pin_hash: pinHash,
          badge_pin_is_default: true, // Mark as needing PIN change
          badge_pin_attempts: 0,
        })
        .eq('id', employee.id);

      // Create emps record for the user
      await supabase
        .from('emps')
        .upsert({
          user_id: authData.user.id,
          badge_number: badgeNumber,
          display_name: `${employee.name_first} ${employee.name_last}`,
        }, { onConflict: 'user_id' });

      // Generate magic link for session
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
      });

      if (linkError || !linkData) {
        console.error('[badge-auth] Magic link generation failed:', linkError);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Account created! Please log in with your badge.',
          requiresLogin: true,
          requiresPinChange: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return the magic link for client-side verification
      return new Response(JSON.stringify({
        success: true,
        magicLink: linkData.properties?.action_link,
        requiresPinChange: true,
        employeeName: `${employee.name_first} ${employee.name_last}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // CHANGE-PIN - Update PIN after first login with default
    // =============================================================================
    if (action === 'change-pin') {
      if (!badgeNumber || !pin || !newPin) {
        return new Response(JSON.stringify({ error: 'Badge number, current PIN, and new PIN are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newPin.length < 4 || newPin.length > 8) {
        return new Response(JSON.stringify({ error: 'New PIN must be 4-8 digits' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, badge_pin_hash, badge_pin_is_default')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify current PIN
      const currentPinHash = await hashString(pin);
      if (employee.badge_pin_hash !== currentPinHash) {
        return new Response(JSON.stringify({ error: 'Current PIN is incorrect' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update to new PIN
      const newPinHash = await hashString(newPin);
      await supabase
        .from('employees')
        .update({
          badge_pin_hash: newPinHash,
          badge_pin_is_default: false, // No longer using default PIN
        })
        .eq('id', employee.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'PIN updated successfully!',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // SIGNUP-REQUEST - Send OTP to supervisor for new badge user (legacy flow)
    // =============================================================================
    if (action === 'signup-request') {
      if (!badgeNumber) {
        return new Response(JSON.stringify({ error: 'Badge number is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee and supervisor
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, name_first, name_last, user_id, badge_pin_hash, reports_to')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already has account
      if (employee.user_id && employee.badge_pin_hash) {
        return new Response(JSON.stringify({ error: 'Account already exists. Please use login instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get supervisor email
      let supervisorEmail = null;
      if (employee.reports_to) {
        const { data: supervisor } = await supabase
          .from('employees')
          .select('user_email')
          .eq('id', employee.reports_to)
          .maybeSingle();
        supervisorEmail = supervisor?.user_email;
      }

      if (!supervisorEmail) {
        return new Response(JSON.stringify({ 
          error: 'No supervisor email found. Please contact HR for assistance.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate OTP and store hash
      const otpCode = generateOTP();
      const otpHash = await hashString(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await supabase
        .from('employees')
        .update({
          badge_verification_code: otpHash,
          badge_verification_expires_at: expiresAt.toISOString(),
        })
        .eq('id', employee.id);

      // Send email to supervisor via Supabase Auth (using admin API)
      const emailSubject = `BuntingGPT Access Request - ${employee.name_first} ${employee.name_last}`;
      const emailBody = `
Employee ${employee.name_first} ${employee.name_last} (Badge: ${badgeNumber}) is requesting access to BuntingGPT.

Please provide them with this verification code: ${otpCode}

This code expires in 10 minutes.

If you did not expect this request, please contact IT.
      `;

      // Try to send email via Resend if available
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BuntingGPT <noreply@buntinggpt.com>',
              to: [supervisorEmail],
              subject: emailSubject,
              text: emailBody,
            }),
          });
          
          if (!emailResponse.ok) {
            console.error('[badge-auth] Email send failed:', await emailResponse.text());
          }
        } catch (emailErr) {
          console.error('[badge-auth] Email error:', emailErr);
        }
      } else {
        console.log('[badge-auth] No RESEND_API_KEY, OTP would be sent to:', supervisorEmail);
        console.log('[badge-auth] OTP code (dev only):', otpCode);
      }

      return new Response(JSON.stringify({
        success: true,
        supervisorEmail: maskEmail(supervisorEmail),
        message: `Verification code sent to your supervisor at ${maskEmail(supervisorEmail)}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // SIGNUP-VERIFY - Verify OTP and create account with PIN (legacy flow)
    // =============================================================================
    if (action === 'signup-verify') {
      if (!badgeNumber || !otp || !pin) {
        return new Response(JSON.stringify({ error: 'Badge number, OTP, and PIN are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (pin.length < 4 || pin.length > 8) {
        return new Response(JSON.stringify({ error: 'PIN must be 4-8 digits' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, name_first, name_last, badge_verification_code, badge_verification_expires_at')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify OTP
      const otpHash = await hashString(otp);
      if (employee.badge_verification_code !== otpHash) {
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check expiry
      if (new Date(employee.badge_verification_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Verification code has expired. Please request a new one.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create synthetic email and auth user
      const syntheticEmail = `badge_${badgeNumber}@internal.buntingmagnetics.com`;
      const tempPassword = crypto.randomUUID(); // Random password, user will use PIN

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: syntheticEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          badge_number: badgeNumber,
          full_name: `${employee.name_first} ${employee.name_last}`,
        },
      });

      if (authError) {
        console.error('[badge-auth] Auth user creation failed:', authError);
        return new Response(JSON.stringify({ error: 'Failed to create account. Please try again.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Hash and store PIN, link user_id
      const pinHash = await hashString(pin);
      await supabase
        .from('employees')
        .update({
          user_id: authData.user.id,
          badge_pin_hash: pinHash,
          badge_pin_is_default: false, // User set their own PIN
          badge_verification_code: null,
          badge_verification_expires_at: null,
          badge_pin_attempts: 0,
        })
        .eq('id', employee.id);

      // Create emps record for the user
      await supabase
        .from('emps')
        .upsert({
          user_id: authData.user.id,
          badge_number: badgeNumber,
          display_name: `${employee.name_first} ${employee.name_last}`,
        }, { onConflict: 'user_id' });

      // Sign in the user and return session
      const { data: sessionData, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
      });

      // Use admin to create a session directly
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: tempPassword,
      });

      if (signInErr || !signInData.session) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Account created! Please log in with your badge and PIN.',
          requiresLogin: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // LOGIN - Authenticate with badge + PIN
    // =============================================================================
    if (action === 'login') {
      if (!badgeNumber || !pin) {
        return new Response(JSON.stringify({ error: 'Badge number and PIN are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, user_id, badge_pin_hash, badge_pin_is_default, badge_pin_attempts, badge_pin_locked_until')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!employee.user_id || !employee.badge_pin_hash) {
        return new Response(JSON.stringify({ error: 'No account found. Please sign up first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check lockout
      if (employee.badge_pin_locked_until && new Date(employee.badge_pin_locked_until) > new Date()) {
        const remainingMs = new Date(employee.badge_pin_locked_until).getTime() - Date.now();
        const remainingMins = Math.ceil(remainingMs / 60000);
        return new Response(JSON.stringify({ 
          error: `Account locked. Please try again in ${remainingMins} minute(s).` 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify PIN
      const pinHash = await hashString(pin);
      if (employee.badge_pin_hash !== pinHash) {
        // Increment attempts
        const newAttempts = (employee.badge_pin_attempts || 0) + 1;
        const updates: any = { badge_pin_attempts: newAttempts };
        
        if (newAttempts >= 5) {
          updates.badge_pin_locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min lockout
        }
        
        await supabase.from('employees').update(updates).eq('id', employee.id);

        const attemptsLeft = 5 - newAttempts;
        return new Response(JSON.stringify({ 
          error: attemptsLeft > 0 
            ? `Invalid PIN. ${attemptsLeft} attempt(s) remaining.` 
            : 'Too many failed attempts. Account locked for 15 minutes.'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reset attempts on successful login
      await supabase.from('employees').update({
        badge_pin_attempts: 0,
        badge_pin_locked_until: null,
      }).eq('id', employee.id);

      // Get auth user and create session
      const { data: authUser } = await supabase.auth.admin.getUserById(employee.user_id);
      if (!authUser?.user) {
        return new Response(JSON.stringify({ error: 'User account not found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate a magic link token and exchange it for a session
      const syntheticEmail = `badge_${badgeNumber}@internal.buntingmagnetics.com`;
      
      // Create a one-time token for this user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
      });

      if (linkError || !linkData) {
        console.error('[badge-auth] Magic link generation failed:', linkError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Extract the token from the action link
      const actionLink = linkData.properties?.action_link;
      if (!actionLink) {
        return new Response(JSON.stringify({ error: 'Failed to create session link' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return the magic link for client-side verification
      return new Response(JSON.stringify({
        success: true,
        magicLink: actionLink,
        user: authUser.user,
        requiresPinChange: employee.badge_pin_is_default === true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // RESET-REQUEST - Request PIN reset via supervisor OTP
    // =============================================================================
    if (action === 'reset-request') {
      if (!badgeNumber) {
        return new Response(JSON.stringify({ error: 'Badge number is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get employee
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, name_first, name_last, user_id, reports_to')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!employee.user_id) {
        return new Response(JSON.stringify({ error: 'No account found. Please sign up first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get supervisor email
      let supervisorEmail = null;
      if (employee.reports_to) {
        const { data: supervisor } = await supabase
          .from('employees')
          .select('user_email')
          .eq('id', employee.reports_to)
          .maybeSingle();
        supervisorEmail = supervisor?.user_email;
      }

      if (!supervisorEmail) {
        return new Response(JSON.stringify({ 
          error: 'No supervisor email found. Please contact HR for assistance.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate OTP
      const otpCode = generateOTP();
      const otpHash = await hashString(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await supabase
        .from('employees')
        .update({
          badge_verification_code: otpHash,
          badge_verification_expires_at: expiresAt.toISOString(),
        })
        .eq('id', employee.id);

      // Send email
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BuntingGPT <noreply@buntinggpt.com>',
              to: [supervisorEmail],
              subject: `BuntingGPT PIN Reset - ${employee.name_first} ${employee.name_last}`,
              text: `Employee ${employee.name_first} ${employee.name_last} (Badge: ${badgeNumber}) is requesting a PIN reset.\n\nVerification code: ${otpCode}\n\nThis code expires in 10 minutes.`,
            }),
          });
        } catch (emailErr) {
          console.error('[badge-auth] Email error:', emailErr);
        }
      } else {
        console.log('[badge-auth] OTP code (dev only):', otpCode);
      }

      return new Response(JSON.stringify({
        success: true,
        supervisorEmail: maskEmail(supervisorEmail),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================================================
    // RESET-VERIFY - Verify OTP and set new PIN
    // =============================================================================
    if (action === 'reset-verify') {
      if (!badgeNumber || !otp || !pin) {
        return new Response(JSON.stringify({ error: 'Badge number, OTP, and new PIN are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, badge_verification_code, badge_verification_expires_at')
        .eq('badge_number', badgeNumber)
        .maybeSingle();

      if (empError || !employee) {
        return new Response(JSON.stringify({ error: 'Badge number not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify OTP
      const otpHash = await hashString(otp);
      if (employee.badge_verification_code !== otpHash) {
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(employee.badge_verification_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Verification code has expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update PIN
      const pinHash = await hashString(pin);
      await supabase
        .from('employees')
        .update({
          badge_pin_hash: pinHash,
          badge_pin_is_default: false, // User set their own PIN
          badge_verification_code: null,
          badge_verification_expires_at: null,
          badge_pin_attempts: 0,
          badge_pin_locked_until: null,
        })
        .eq('id', employee.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'PIN updated successfully. Please log in with your new PIN.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[badge-auth] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
