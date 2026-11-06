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

/** Admin → user email draft (opens local mail client). */
export function buildAdminUserMailto(params: {
  toEmail: string;
  subject?: string;
  message?: string;
  adminName?: string | null;
}) {
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

  const query = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
  ].join('&');

  return `mailto:${params.toEmail}?${query}`;
}
