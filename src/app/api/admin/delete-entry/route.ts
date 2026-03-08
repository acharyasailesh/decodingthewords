import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const { id, type } = await req.json();

    if (!id || !type) {
        return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });
    }

    try {
        if (type === 'user') {
            // First delete the auth user
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.error("Auth deletion failed:", authError);
                // We'll continue anyway just in case the auth user is already gone
            }

            // Then delete from the public users table
            const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
            if (dbError) throw dbError;

        } else if (type === 'submission') {
            // Delete from the submissions table
            const { error: dbError } = await supabaseAdmin.from('submissions').delete().eq('id', id);
            if (dbError) throw dbError;
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
