// The lifecycle strip - shows where a request stands on its path to payment
export default function Journey({ request }) {
  const steps = ['Submitted', 'Finance', ...(request.needsDirector ? ['Director'] : []), 'Paid', 'Closed'];

  const reached = (() => {
    const s = request.status;
    if (s === 'draft' || s === 'sent_back') return 0;
    if (s === 'submitted') return 1;
    if (s === 'finance_approved') return 2;
    if (s === 'approved') return request.needsDirector ? 3 : 2;
    if (s === 'paid') return steps.length - 1;
    if (s === 'closed') return steps.length;
    return 0; // rejected shown via badge
  })();

  if (request.status === 'rejected') return null;

  return (
    <div className="journey">
      {steps.map((label, i) => (
        <div key={label} className={`step ${i < reached ? 'done' : i === reached ? 'current' : ''}`}>
          {i > 0 && <div className={`bar ${i <= reached ? 'filled' : ''}`} />}
          <div className="dot">{i < reached ? '✓' : i + 1}</div>
          <div className="lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}
