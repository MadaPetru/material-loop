export const SUPPORT_EMAIL = 'mada.petru@digitalexplorer.ro';

export type ContactTopic = 'bug' | 'change' | 'other';

export function contactSubjectTag(topic: ContactTopic, subject: string) {
  const tag =
    topic === 'bug'
      ? '[MaterialLoop] Bug report'
      : topic === 'change'
        ? '[MaterialLoop] Change request'
        : '[MaterialLoop] Contact';
  const trimmed = subject.trim();
  return trimmed ? `${tag}: ${trimmed}` : tag;
}

export function buildContactMailto(params: {
  topic: ContactTopic;
  subject: string;
  message: string;
  replyEmail?: string | null;
  displayName?: string | null;
  userId?: string | null;
}) {
  const subject = contactSubjectTag(params.topic, params.subject);
  const lines = [
    params.message.trim(),
    '',
    '---',
    'Sent from MaterialLoop',
    params.displayName ? `Name: ${params.displayName}` : null,
    params.replyEmail ? `Reply-to: ${params.replyEmail}` : null,
    params.userId ? `User ID: ${params.userId}` : null,
    `Topic: ${params.topic}`,
  ].filter((line): line is string => line != null);

  const query = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(lines.join('\n'))}`,
  ].join('&');

  return `mailto:${SUPPORT_EMAIL}?${query}`;
}

/** Admin / marketing → user email draft (opens local mail client). */
export function buildAdminUserMailto(params: {
  toEmail: string | string[];
  subject?: string;
  message?: string;
  adminName?: string | null;
}) {
  const emails = (Array.isArray(params.toEmail) ? params.toEmail : [params.toEmail])
    .map((e) => e.trim())
    .filter(Boolean);
  if (!emails.length) throw new Error('No recipient email.');

  const subject = params.subject?.trim() || '[MaterialLoop] Message from administration';
  const body = [
    params.message?.trim() || '',
    '',
    '---',
    'MaterialLoop administration',
    params.adminName ? `Sent by: ${params.adminName}` : null,
  ]
    .filter((line): line is string => line != null)
    .join('\n');

  const parts = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
  ];
  // One primary To; extra recipients as BCC when the URL stays reasonably short.
  const to = emails[0];
  const bcc = emails.slice(1);
  if (bcc.length) parts.push(`bcc=${encodeURIComponent(bcc.join(','))}`);

  return `mailto:${to}?${parts.join('&')}`;
}
