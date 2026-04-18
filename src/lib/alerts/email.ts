const RESEND_SEND_ENDPOINT = 'https://api.resend.com/emails';

export interface AlertEmailPayload {
  subject: string;
  text: string;
  html?: string;
}

export interface AlertEmailResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
  error?: string;
  id?: string;
}

function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function textToHtml(text: string): string {
  return `<pre style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space:pre-wrap;">${text}</pre>`;
}

export async function sendAlertEmail(payload: AlertEmailPayload): Promise<AlertEmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY is missing' };
  }

  const recipients = parseRecipients(
    process.env.ALERT_EMAIL_TO || process.env.ALERT_EMAIL_RECIPIENTS,
  );
  if (recipients.length === 0) {
    return { sent: false, skipped: true, reason: 'ALERT_EMAIL_TO is missing' };
  }

  const from =
    (process.env.ALERT_EMAIL_FROM || process.env.RESEND_FROM || '').trim() ||
    'NOCTVM Alerts <onboarding@resend.dev>';

  try {
    const response = await fetch(RESEND_SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: payload.subject,
        text: payload.text,
        html: payload.html || textToHtml(payload.text),
      }),
      cache: 'no-store',
    });

    const json = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      return {
        sent: false,
        skipped: false,
        error: json.message || json.name || `HTTP ${response.status}`,
      };
    }

    return {
      sent: true,
      skipped: false,
      id: json.id,
    };
  } catch (error) {
    return {
      sent: false,
      skipped: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

