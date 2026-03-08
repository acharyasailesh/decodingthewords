import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'saleshacharya@bizbazar.com'; // Update this to your admin email

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { type, name, email, referenceNumber, fullName } = body;

    try {
        if (type === 'submission') {
            // 1. Email to user confirming their submission
            await resend.emails.send({
                from: 'Decoding The Words <onboarding@resend.dev>',
                to: [email],
                subject: `🎉 We received your submission! (Ref: ${referenceNumber})`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2340;">
                        <div style="background: #1A2340; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #B8860B; margin: 0; font-size: 24px;">Decoding The Words</h1>
                            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0 0; font-size: 14px;">शब्दले संसार बदल्छ</p>
                        </div>
                        <div style="background: #fff; padding: 40px; border: 1px solid #eee; border-top: none;">
                            <h2 style="color: #1A2340;">Hello, ${name}! 👋</h2>
                            <p style="color: #555; line-height: 1.6;">
                                Thank you for purchasing <strong>Decoding The Words</strong>. We have received your payment proof and it is now in our review queue.
                            </p>
                            <div style="background: #F5F7FA; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px dashed #ccc;">
                                <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Reference Code</p>
                                <h2 style="margin: 8px 0 0 0; color: #1A2340; font-size: 28px; letter-spacing: 3px;">${referenceNumber}</h2>
                            </div>
                            <h3 style="color: #1A2340;">What happens next?</h3>
                            <ol style="color: #555; line-height: 2;">
                                <li>Our team will verify your payment screenshot within <strong>24 hours</strong>.</li>
                                <li>You will receive an email with a link to set your password.</li>
                                <li>Click the link, set your password, and start reading!</li>
                            </ol>
                            <p style="color: #888; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px;">
                                If you have any questions, simply reply to this email. Keep your reference code safe: <strong>${referenceNumber}</strong>
                            </p>
                        </div>
                        <div style="background: #F5F7FA; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; color: #aaa; font-size: 12px;">© 2026 Decoding The Words. All rights reserved.</p>
                        </div>
                    </div>
                `,
            });

            // 2. Email to admin notifying of new submission
            await resend.emails.send({
                from: 'Decoding The Words System <onboarding@resend.dev>',
                to: [ADMIN_EMAIL],
                subject: `🔔 New Payment Submission — ${referenceNumber}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #1A2340; padding: 20px 30px; border-radius: 12px 12px 0 0;">
                            <h2 style="color: #B8860B; margin: 0;">New Submission Alert</h2>
                        </div>
                        <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px; color: #888; font-size: 13px;">Reference</td><td style="padding: 8px; font-weight: bold; color: #1A2340;">${referenceNumber}</td></tr>
                                <tr style="background:#F5F7FA"><td style="padding: 8px; color: #888; font-size: 13px;">Name</td><td style="padding: 8px; font-weight: bold;">${name}</td></tr>
                                <tr><td style="padding: 8px; color: #888; font-size: 13px;">Email</td><td style="padding: 8px;">${email}</td></tr>
                            </table>
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="https://decodingthewords.com/admin/submissions" style="background: #1A2340; color: #B8860B; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    View in Admin Panel →
                                </a>
                            </div>
                        </div>
                    </div>
                `,
            });

        } else if (type === 'license_rejected') {
            // Email to user when admin rejects their submission
            const rejectionReason = body.reason || 'Provided payment proof was invalid or could not be verified.';
            await resend.emails.send({
                from: 'Decoding The Words <onboarding@resend.dev>',
                to: [email],
                subject: `❌ Submission Update — Decoding The Words`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2340;">
                        <div style="background: #1A2340; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #B8860B; margin: 0; font-size: 24px;">Decoding The Words</h1>
                        </div>
                        <div style="background: #fff; padding: 40px; border: 1px solid #eee; border-top: none;">
                            <h2 style="color: #1A2340;">Hello, ${name}!</h2>
                            <p style="color: #555; line-height: 1.6;">
                                Thank you for your interest in <strong>Decoding The Words</strong>. Unfortunately, we could not approve your recent payment submission (Ref: ${referenceNumber}).
                            </p>
                            <div style="background: #FFF5F5; border-left: 4px solid #F87171; padding: 20px; margin: 24px 0;">
                                <p style="margin: 0; color: #991B1B; font-weight: bold; font-size: 13px; text-transform: uppercase;">Reason for Rejection:</p>
                                <p style="margin: 8px 0 0 0; color: #555; line-height: 1.6;">${rejectionReason}</p>
                            </div>
                            <p style="color: #555; line-height: 1.6;">
                                If you believe this is a mistake, please reply to this email or submit a new proof with the correct details.
                            </p>
                            <div style="margin-top: 32px; text-align: center;">
                                <a href="https://decodingthewords.com/buy" style="background: #1A2340; color: #B8860B; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                    Try Again →
                                </a>
                            </div>
                        </div>
                        <div style="background: #F5F7FA; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; color: #aaa; font-size: 12px;">© 2026 Decoding The Words. All rights reserved.</p>
                        </div>
                    </div>
                `,
            });
        } else if (type === 'license_approved') {
            await resend.emails.send({
                from: 'Decoding The Words <onboarding@resend.dev>',
                to: [email],
                subject: `✅ Your license is approved — Start reading now!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2340;">
                        <div style="background: #1A2340; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #B8860B; margin: 0; font-size: 24px;">Decoding The Words</h1>
                        </div>
                        <div style="background: #fff; padding: 40px; border: 1px solid #eee; border-top: none; text-align: center;">
                            <div style="font-size: 48px;">🎉</div>
                            <h2 style="color: #1A2340;">Congratulations, ${fullName || name}!</h2>
                            <p style="color: #555; line-height: 1.6; max-width: 420px; margin: 0 auto;">
                                Your license for <strong>Decoding The Words</strong> has been approved! You can now log in and start reading.
                            </p>
                            <div style="margin-top: 32px;">
                                <a href="https://decodingthewords.com/login" style="background: #B8860B; color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                                    Start Reading Now →
                                </a>
                            </div>
                        </div>
                    </div>
                `,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('=== EMAIL SEND ERROR ===');
        console.error(JSON.stringify(error, null, 2));
        if (error instanceof Error) {
            console.error('Message:', error.message);
        }
        return NextResponse.json({ error: 'Failed to send email', details: String(error) }, { status: 500 });
    }
}
