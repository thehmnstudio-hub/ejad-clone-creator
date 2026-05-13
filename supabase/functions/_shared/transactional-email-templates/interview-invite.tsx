import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Ejad Labs"

interface InterviewInviteProps {
  applicantName?: string
  interviewerName?: string
  interviewerRole?: string
  funnelName?: string
  date?: string
  time?: string
  icsData?: string
}

const InterviewInviteEmail = ({
  applicantName,
  interviewerName,
  interviewerRole,
  funnelName,
  date,
  time,
}: InterviewInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your interview with ${SITE_NAME} is scheduled for ${date ?? 'TBD'} at ${time ?? 'TBD'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Interview Scheduled! 🎉
        </Heading>
        <Text style={text}>
          {applicantName ? `Hi ${applicantName},` : 'Hello,'}
        </Text>
        <Text style={text}>
          Your interview for the <strong>{funnelName || 'program'}</strong> has been scheduled. Here are your details:
        </Text>
        <Section style={detailsBox}>
          <Text style={detailLabel}>📅 Date</Text>
          <Text style={detailValue}>{date || 'TBD'}</Text>
          <Text style={detailLabel}>🕐 Time</Text>
          <Text style={detailValue}>{time || 'TBD'} (Pakistan Standard Time)</Text>
          <Text style={detailLabel}>👤 Interviewer</Text>
          <Text style={detailValue}>{interviewerName || 'Team Member'}{interviewerRole ? ` — ${interviewerRole}` : ''}</Text>
        </Section>
        <Text style={text}>
          Please check the attached calendar invite (.ics) to add this event to your calendar. You'll receive a call at the scheduled time.
        </Text>
        <Hr style={hr} />
        <Text style={text}>
          <strong>What to prepare:</strong>
        </Text>
        <Text style={text}>
          • A brief overview of your business or idea{'\n'}
          • Any questions about the program{'\n'}
          • Be available 5 minutes before the scheduled time
        </Text>
        <Hr style={hr} />
        <Text style={text}>
          Need to reschedule? Reply to this email or reach out on WhatsApp at{' '}
          <a href="https://wa.me/923458881914" style={link}>+92 345 888 1914</a>.
        </Text>
        <Text style={footer}>
          Best regards,{'\n'}The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InterviewInviteEmail,
  subject: (data: Record<string, any>) =>
    `Interview Scheduled — ${data.funnelName || 'Ejad Labs'} | ${data.date || ''}`,
  displayName: 'Interview Invite',
  previewData: {
    applicantName: 'Jane Doe',
    interviewerName: 'Zainab Jamshed',
    interviewerRole: 'Partnerships Manager',
    funnelName: 'Silicon Valley Tech Exchange',
    date: 'Monday, April 7, 2025',
    time: '2:00 PM',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#444444', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = {
  backgroundColor: '#fdf2f8',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '16px 0 24px',
  borderLeft: '4px solid hsl(330, 85%, 55%)',
}
const detailLabel = { fontSize: '12px', color: '#888888', fontWeight: 'bold' as const, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const detailValue = { fontSize: '16px', color: '#1a1a1a', fontWeight: '600' as const, margin: '0 0 14px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const link = { color: 'hsl(330, 85%, 55%)', textDecoration: 'underline' }
const footer = { fontSize: '13px', color: '#999999', margin: '24px 0 0', whiteSpace: 'pre-line' as const }
