// src/components/design-system/Button.jsx
// Syndicade Button — Design System §6 / Build List #2
// CODE RULE (§21): className via string concatenation, var only — never const/let.

// Secondary vs. Ghost differentiated per §6 (decided June 21, 2026):
//   Secondary — bordered, alternate action with similar weight to Primary
//   Ghost     — no border, lowest-emphasis action
var VARIANT_CLASSNAMES = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
  secondary: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' // delete only
};

// props:
//   variant: 'primary' | 'secondary' | 'ghost' | 'danger' (default 'primary')
//   showArrow: bool — renders "→", only ever applied when variant is 'primary' (§6 rule, enforced below)
//   disabled: bool — stays focusable (no native disabled attr), announced via aria-disabled
//   type: 'button' | 'submit' | 'reset' (default 'button')
//   ariaLabel: string — required if button is icon-only with no visible text
//   onClick, className, children
function Button(props) {
  var variant = props.variant || 'primary';
  var disabled = props.disabled || false;
  var type = props.type || 'button';
  var extraClassName = props.className || '';
  var variantClass = VARIANT_CLASSNAMES[variant] || VARIANT_CLASSNAMES.primary;
  var renderArrow = props.showArrow && variant === 'primary'; // arrow allowed in primary CTAs only

  var baseClass = 'h-11 px-6 font-semibold rounded-lg inline-flex items-center justify-center gap-2 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  var disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  var finalClassName = baseClass + ' ' + variantClass + ' ' + disabledClass + ' ' + extraClassName;

  function handleClick(e) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (props.onClick) {
      props.onClick(e);
    }
  }

  return (
    <button
      type={type}
      className={finalClassName}
      onClick={handleClick}
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={props.ariaLabel || undefined}
    >
      {props.children}
      {renderArrow ? <span aria-hidden="true">→</span> : null}
    </button>
  );
}

export default Button;
export { Button };