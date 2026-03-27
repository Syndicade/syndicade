import { useState } from 'react';

var SUPABASE_DONATION_URL = 'https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-donation-session';

var QUICK_AMOUNTS = [10, 25, 50, 100];

export default function DonationSection({ org, primary, borderRadius }) {
  var [customAmount, setCustomAmount] = useState('');
  var [selectedAmount, setSelectedAmount] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [donated, setDonated] = useState(
    typeof window !== 'undefined' && window.location.search.includes('donated=true')
  );

  var suggested = org.donation_suggested_amount ? Number(org.donation_suggested_amount) : null;
  var title = org.donation_title || 'Support ' + org.name;
  var description = org.donation_description || 'Your donation helps us continue our work in the community.';
  var externalLink = org.donation_external_link || null;

  var activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  function handleQuickSelect(amount) {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  }

  function handleCustomChange(e) {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
    setError(null);
  }

  async function handleStripeDonate() {
    var amount = activeAmount;
    if (!amount || isNaN(amount) || amount < 1) {
      setError('Please enter a donation amount of at least $1.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      var res = await fetch(SUPABASE_DONATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          org_name: org.name,
          org_id: org.id,
          success_url: window.location.href,
          cancel_url: window.location.href,
        }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start donation');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (donated) {
    return (
      <section className="py-16 px-6" style={{ backgroundColor: (primary || '#3B82F6') + '08' }} aria-label="Donation confirmation">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: (primary || '#3B82F6') + '20' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary || '#3B82F6' }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500">Your donation to {org.name} has been received. We truly appreciate your support.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6" style={{ backgroundColor: (primary || '#3B82F6') + '08' }} aria-labelledby="donation-heading">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: (primary || '#3B82F6') + '20' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary || '#3B82F6' }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 id="donation-heading" className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

          {/* Quick amount buttons */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Select an amount</p>
            <div className="grid grid-cols-4 gap-2">
              {(suggested && !QUICK_AMOUNTS.includes(suggested)
                ? [suggested].concat(QUICK_AMOUNTS).sort(function(a,b){return a-b;}).slice(0,4)
                : QUICK_AMOUNTS
              ).map(function(amount) {
                var isSelected = selectedAmount === amount && !customAmount;
                return (
                  <button
                    key={amount}
                    onClick={function() { handleQuickSelect(amount); }}
                    className={'py-2.5 rounded-lg text-sm font-bold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ' + (isSelected
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    )}
                    style={isSelected ? { backgroundColor: primary || '#3B82F6', borderColor: primary || '#3B82F6' } : {}}
                    aria-pressed={isSelected}
                  >
                    {'$' + amount}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label htmlFor="custom-amount" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Or enter a custom amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-semibold text-sm pointer-events-none" aria-hidden="true">$</span>
              <input
                id="custom-amount"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={customAmount}
                onChange={handleCustomChange}
                className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ '--tw-ring-color': primary || '#3B82F6' }}
                aria-label="Custom donation amount in dollars"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}

          {/* Stripe donate button */}
          <button
            onClick={handleStripeDonate}
            disabled={loading || (!activeAmount)}
            className="w-full py-3 font-bold text-sm rounded-lg transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90"
            style={{ backgroundColor: primary || '#3B82F6', color: '#ffffff', borderRadius: borderRadius || '8px' }}
            aria-label={'Donate' + (activeAmount ? ' $' + Number(activeAmount).toFixed(2) : '') + ' via Stripe'}
          >
            {loading ? 'Redirecting...' : ('Donate' + (activeAmount ? ' $' + Number(activeAmount).toFixed(2) : '') + ' Securely')}
          </button>

          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Powered by Stripe. Your payment is secure.
          </p>

          {/* External link option */}
          {externalLink && (
            <div className="pt-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-2">Prefer another method?</p>
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
                style={{ color: primary || '#3B82F6' }}
                aria-label={'Donate via external link, opens in new tab'}
              >
                Donate via PayPal / Venmo / Other
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}