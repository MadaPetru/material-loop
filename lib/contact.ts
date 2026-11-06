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
