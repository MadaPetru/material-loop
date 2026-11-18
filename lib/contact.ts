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

type AdminMailDraftParams = {
  toEmail: string | string[];
  subject?: string;
  message?: string;
  adminName?: string | null;
  /** Visible To address; all user recipients go to BCC only. */
  adminEmail?: string | null;
};

function buildAdminMailDraft(params: AdminMailDraftParams) {
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

  // Always BCC recipients so they cannot see each other.
  // Visible To is the admin (or support) address — not a user recipient.
  const visibleTo = params.adminEmail?.trim() || SUPPORT_EMAIL;
  const bcc = emails.filter((e) => e.toLowerCase() !== visibleTo.toLowerCase());
  return { subject, body, visibleTo, bcc };
}

/** Admin / marketing → user email draft (opens local mail client). */
export function buildAdminUserMailto(params: AdminMailDraftParams) {
  const { subject, body, visibleTo, bcc } = buildAdminMailDraft(params);
  const parts = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
    `bcc=${encodeURIComponent(bcc.join(','))}`,
  ];
  return `mailto:${encodeURIComponent(visibleTo)}?${parts.join('&')}`;
}

/**
 * Admin / marketing → Gmail web compose (avoids broken Windows MAILTO handlers).
 * Opens in the browser; recipients stay in BCC only.
 */
export function buildAdminUserGmailComposeUrl(params: AdminMailDraftParams) {
  const { subject, body, visibleTo, bcc } = buildAdminMailDraft(params);
  const query = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: visibleTo,
    su: subject,
    body,
  });
  if (bcc.length) query.set('bcc', bcc.join(','));
  return `https://mail.google.com/mail/?${query.toString()}`;
}
