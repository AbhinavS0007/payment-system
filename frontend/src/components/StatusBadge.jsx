const LABELS = {
  draft: 'Draft',
  submitted: 'Awaiting Finance',
  finance_approved: 'Awaiting Director',
  approved: 'Approved · To Pay',
  sent_back: 'Sent Back',
  rejected: 'Rejected',
  paid: 'Paid',
  closed: 'Closed'
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{LABELS[status] || status}</span>;
}
