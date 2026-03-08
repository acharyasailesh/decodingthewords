import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Uses service role key — server-side only, never exposed to browser
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const { email, name, submissionId } = await req.json();

    if (!email || !submissionId) {
        return NextResponse.json({ error: 'Missing email or submissionId' }, { status: 400 });
    }

    try {
        // 0. Prevent double-approval for the same email
        const { data: alreadyApproved, error: checkError } = await supabaseAdmin
            .from('submissions')
            .select('id, reference_number')
            .eq('email', email)
            .eq('status', 'approved')
            .maybeSingle();

        if (alreadyApproved && alreadyApproved.id !== submissionId) {
            return NextResponse.json({
                error: `This email already has an approved submission (Ref: ${alreadyApproved.reference_number}).`
            }, { status: 400 });
        }

        // 1. Check if user already exists to avoid hitting email rate limits on duplicates
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
            // User already registered — grant license and approve submission
            await supabaseAdmin
                .from('submissions')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('id', submissionId);

            await supabaseAdmin
                .from('users')
                .upsert({
                    id: existingUser.id,
                    email: email,
                    full_name: name,
                    display_name: name,
                    has_license: true,
                    license_granted_at: new Date().toISOString()
                }, { onConflict: 'id' });

            // Send notification email to existing user
            try {
                const protocol = req.headers.get('x-forwarded-proto') || 'http';
                const host = req.headers.get('host');
                const baseUrl = `${protocol}://${host}`;

                await fetch(`${baseUrl}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'license_approved',
                        email: email,
                        name: name,
                        fullName: name
                    }),
                });
            } catch (e) {
                console.error("Failed to send approval email:", e);
            }

            return NextResponse.json({ success: true, note: 'User already registered — license granted' });
        }

        // 2. User does not exist, so invite them — Supabase sends them a "Set your password" email
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: name },
        });

        if (error) {
            console.error('Supabase invite error:', error);
            if (error.status === 429) {
                return NextResponse.json({ error: 'Supabase email rate limit exceeded (3 per hour). Try testing a different email or configure SMTP in Supabase.' }, { status: 429 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Mark submission as approved
        await supabaseAdmin
            .from('submissions')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', submissionId);

        // 3. Pre-create user record with license already granted
        //    (so when they log in after setting password, they have access immediately)
        if (data.user) {
            await supabaseAdmin
                .from('users')
                .upsert({
                    id: data.user.id,
                    email: email,
                    full_name: name,
                    display_name: name,
                    has_license: true,
                    license_granted_at: new Date().toISOString(),
                }, { onConflict: 'id' });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
