export type Severity = 'Low'|'Medium'|'High';
export type Recurrence = 'Low'|'Medium'|'High';
export type RcaRec = { level: 1|2|3|4|5; label: string; method: string; timebox: string };

const MATRIX: Record<Severity, Record<Recurrence, RcaRec>> = {
  Low: {
    Low:    { level:1, label:'Level 1 RCA', method:'Quick check / mini 5 Whys', timebox:'≤24h' },
    Medium: { level:2, label:'Level 2 RCA', method:'5 Whys',                      timebox:'24–48h' },
    High:   { level:3, label:'Level 3 RCA', method:'Fishbone (+ 5 Whys)',         timebox:'≤7 days' },
  },
  Medium: {
    Low:    { level:2, label:'Level 2 RCA', method:'5 Whys',                      timebox:'24–48h' },
    Medium: { level:3, label:'Level 3 RCA', method:'Fishbone (+ 5 Whys)',         timebox:'≤7 days' },
    High:   { level:4, label:'Level 4 RCA', method:'Logic Tree (+ Fishbone)',     timebox:'1–3 weeks' },
  },
  High: {
    Low:    { level:3, label:'Level 3 RCA', method:'Fishbone (+ 5 Whys)',         timebox:'≤7 days' },
    Medium: { level:4, label:'Level 4 RCA', method:'Logic Tree (+ Fishbone)',     timebox:'1–3 weeks' },
    High:   { level:5, label:'Level 5 RCA', method:'Full toolkit (Logic Tree + FMEA + CAPA)', timebox:'Programmatic' },
  },
};

export function mapFrequencyToRecurrence(freq: string): Recurrence {
  const f = (freq || '').toLowerCase();
  if (f.includes('first')) return 'Low';
  if (f.includes('intermittent')) return 'Medium';
  if (f.includes('recurr') || f.includes('multiple')) return 'High';
  return 'Low';
}

export function getRcaRecommendation(severity: Severity, recurrence: Recurrence): RcaRec {
  return MATRIX[severity][recurrence];
}