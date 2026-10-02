import { Link } from "react-router-dom";

const ErrorPage = () => {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600">
          404
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Error 404
        </p>

        <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Page not found
        </h1>

        <p className="mx-auto max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          The page you are looking for does not exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
