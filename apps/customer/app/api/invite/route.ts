import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(request: Request) {
  try {
    const { name, mobile, email } = await request.json();

    if (!name || !mobile || !email) {
      return NextResponse.json({ error: 'Name, mobile, and email are required.' }, { status: 400 });
    }

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : 'http://localhost:3001/auth/callback';

    // Use admin invite — sends a magic link email to the user
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { name, mobile }
    });

    if (error) {
      // If user already exists, generate a magic link instead
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo }
        });

        if (linkError) throw linkError;

        // Ensure user profile exists
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          await supabaseAdmin.from('users').upsert({
            id: existingUser.id,
            name,
            mobile: `+91${mobile}`,
            role: 'customer'
          }, { onConflict: 'id' });
        }

        return NextResponse.json({ success: true, message: 'Login link sent to your email.' });
      }
      throw error;
    }

    // Save profile data to users table
    if (data.user) {
      await supabaseAdmin.from('users').upsert({
        id: data.user.id,
        name,
        mobile: `+91${mobile}`,
        role: 'customer'
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true, message: 'Invite link sent to your email.' });

  } catch (error: any) {
    console.error('Error in /api/invite:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
