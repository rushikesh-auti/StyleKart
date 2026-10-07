import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../utils/adminApi";

const statuses = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const topics = {
  orders: "Orders",
  shipping: "Shipping",
  returns: "Returns",
  payments: "Payments",
  account: "Account",
  other: "Other",
};
const statusLabels = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
const statusStyles = {
  NEW: "bg-rose-100 text-rose-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
};
const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const AdminSupportInbox = () => {
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (status) query.set("status", status);
      if (search) query.set("search", search);

      const response = await adminFetch(`/support/admin/messages?${query}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to load support messages.");
      }

      const nextMessages = result.data || [];
      setMessages(nextMessages);
      setPagination(result.pagination || null);
      setSelectedId((currentId) =>
        nextMessages.some((message) => message._id === currentId)
          ? currentId
          : nextMessages[0]?._id || "",
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load support messages.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const selectedMessage = useMemo(
    () => messages.find((message) => message._id === selectedId),
    [messages, selectedId],
  );

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const updateStatus = async (nextStatus) => {
    if (!selectedMessage || nextStatus === selectedMessage.status) return;

    try {
      setUpdating(true);
      setError("");
      const response = await adminFetch(
        `/support/admin/messages/${selectedMessage._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to update message status.");
      }

      await loadMessages();
    } catch (requestError) {
      setError(requestError.message || "Unable to update message status.");
    } finally {
      setUpdating(false);
    }
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-500">
            Admin operations
          </p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
            Support inbox
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review customer requests and keep their status up to date.
          </p>
        </div>
        <Link
          to="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
        >
          Dashboard
        </Link>
      </div>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Customer messages
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination?.total ?? 0}{" "}
              {pagination?.total === 1 ? "request" : "requests"}
              {status ? ` · ${statusLabels[status]}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={loadMessages}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        <form
          onSubmit={submitSearch}
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <label className="sr-only" htmlFor="support-search">
            Search customer, email, order ID, or message
          </label>
          <input
            id="support-search"
            type="search"
            maxLength={100}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search customer, email, order ID, or message"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
          <label className="sr-only" htmlFor="support-status">
            Filter by status
          </label>
          <select
            id="support-status"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-600"
          >
            Search
          </button>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
        >
          {error}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-16 text-center text-sm font-semibold text-slate-500">
              Loading support messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-base font-black text-slate-800">
                No support requests found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {messages.map((message) => {
                  const isSelected = selectedMessage?._id === message._id;
                  return (
                    <button
                      key={message._id}
                      type="button"
                      onClick={() => setSelectedId(message._id)}
                      aria-pressed={isSelected}
                      className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${
                        isSelected
                          ? "border-l-4 border-brand-600 bg-brand-50/60"
                          : "border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {message.name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {message.email}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${statusStyles[message.status]}`}
                        >
                          {statusLabels[message.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-500">
                        <span>{topics[message.topic] || "Other"}</span>
                        {message.orderId && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Order {message.orderId}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <time dateTime={message.createdAt}>
                          {formatDate(message.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {message.message}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">
                  Page {pagination?.page || page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    disabled={loading || page <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(current + 1, totalPages))
                    }
                    disabled={loading || page >= totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="min-h-64 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {!selectedMessage ? (
            <div className="grid min-h-56 place-items-center text-center text-sm font-semibold text-slate-500">
              Select a request to read the full message.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-brand-700">
                    {topics[selectedMessage.topic] || "Other"}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {selectedMessage.name}
                  </h2>
                  <a
                    className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
                    href={`mailto:${selectedMessage.email}`}
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusStyles[selectedMessage.status]}`}
                >
                  {statusLabels[selectedMessage.status]}
                </span>
              </div>

              <dl className="grid gap-4 border-b border-slate-100 py-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Received
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {formatDate(selectedMessage.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Order ID
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {selectedMessage.orderId || "Not provided"}
                  </dd>
                </div>
              </dl>

              <div className="py-5">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Message
                </h3>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <label
                  htmlFor="support-update-status"
                  className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400"
                >
                  Update status
                </label>
                <select
                  id="support-update-status"
                  value={selectedMessage.status}
                  disabled={updating}
                  onChange={(event) => updateStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-60"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item]}
                    </option>
                  ))}
                </select>
                {updating && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Updating status...
                  </p>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
};

export default AdminSupportInbox;
