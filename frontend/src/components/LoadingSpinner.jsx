const LoadingSpinner = () => (
  <div className="grid min-h-[45vh] place-items-center px-4">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="mt-4 text-sm font-semibold text-slate-500">
        Loading StyleKart…
      </p>
    </div>
  </div>
);
export default LoadingSpinner;
