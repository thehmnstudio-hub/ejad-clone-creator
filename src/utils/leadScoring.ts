// Lead score: 0–100 computed from fields already on the lead row (no extra queries).
// Displayed as a colored badge in the Contacts table.

const STATUS_POINTS: Record<string, number> = {
  new: 5,
  Open: 5,
  contacted: 15,
  Connected: 20,
  ATC: 25,
  "Failed to Contact": 5,
  qualified: 50,
  Qualified: 50,
  converted: 100,
  Unqualified: 0,
  "Not interested": 0,
  Irrelevant: 0,
  lost: 0,
};

export function computeLeadScore(lead: Record<string, any>): number {
  let score = 0;

  // Status is the primary driver
  score += STATUS_POINTS[lead.lead_status] ?? 5;

  // Profile completeness
  if (lead.phone) score += 5;
  if (lead.company) score += 5;
  if (lead.nature_of_business) score += 8;
  if (lead.city) score += 3;
  if (lead.expected_annual_revenue) score += 5;

  // Qualified relevancy signals
  if (lead.relevancy === "qualified") score += 10;
  if (lead.relevancy === "irrelevant") score -= 10;

  // Attribution — lead came via a tracked channel
  if (lead.utm_source) score += 5;
  if (lead.gclid || lead.fbclid) score += 3;

  // Recency bonus — submitted within the last 14 days
  if (lead.created_at) {
    const daysOld = (Date.now() - new Date(lead.created_at).getTime()) / 86_400_000;
    if (daysOld <= 3) score += 10;
    else if (daysOld <= 14) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 60) return { label: `${score}`, className: "bg-green-100 text-green-800" };
  if (score >= 30) return { label: `${score}`, className: "bg-yellow-100 text-yellow-800" };
  return { label: `${score}`, className: "bg-muted text-muted-foreground" };
}
