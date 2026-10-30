// "21 years" loader. Hidden by CSS unless the head script set html.loader-on; counted by behaviors/loader.ts.
export function Loader({ label }: { label: string }) {
  return (
    <div className="loader" data-loader role="status" aria-live="polite">
      <div className="loader__in">
        <span className="loader__logo" role="img" aria-label="Creative Screens"></span>
        <p className="loader__num"><span data-loader-num className="ltr">0</span></p>
        <p className="loader__label">{label}</p>
        <span className="loader__bar" aria-hidden="true"><i data-loader-bar></i></span>
      </div>
    </div>
  );
}
