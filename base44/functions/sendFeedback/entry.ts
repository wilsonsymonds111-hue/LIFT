import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { message } = await req.json();
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    const developerEmail = Deno.env.get("DEVELOPER_EMAIL");
    if (!developerEmail) return Response.json({ error: 'Developer email not configured' }, { status: 500 });

    await base44.integrations.Core.SendEmail({
      to: developerEmail,
      subject: `LIFT Feedback from ${user.full_name || user.email}`,
      body: `From: ${user.full_name || 'Anonymous'} (${user.email})\n\n${message}`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});