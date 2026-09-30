import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaChevronDown,
  FaCircleCheck,
  FaClock,
  FaEnvelope,
  FaMagnifyingGlass,
  FaPhone,
  FaRegCreditCard,
  FaRegUser,
  FaRotateLeft,
  FaTruckFast,
} from "react-icons/fa6";
import { adminApiUrl } from "../utils/adminApi";

/* ---- EDIT THESE: your real support details ---- */
const CONTACT = {
  email: "support@stylekart.com",
  phone: "+91 00000 00000",
  phoneHref: "tel:+910000000000",
  hours: "Mon to Sat, 9 AM to 8 PM IST",
  replyTime: "We reply within 24 hours",
};

const TOPICS = [
  { id: "orders", label: "Orders", icon: FaBoxOpen },
  { id: "shipping", label: "Shipping", icon: FaTruckFast },
  { id: "returns", label: "Returns and refunds", icon: FaRotateLeft },
  { id: "payments", label: "Payments", icon: FaRegCreditCard },
  { id: "account", label: "Account", icon: FaRegUser },
];

/* ---- EDIT THESE: make the answers match your real policies ---- */
const FAQS = [
  {
    topic: "orders",
    q: "How do I track my order?",
    a: "Open Orders from your account menu and select the order. You will see its current status and tracking details once it has shipped.",
  },
  {
    topic: "orders",
    q: "Can I cancel or change my order?",
    a: "You can cancel an order from the Orders page until it is shipped. If it has already shipped, please wait for delivery and use the return option instead.",
  },
  {
    topic: "shipping",
    q: "How long does delivery take?",
    a: "Most orders arrive in 3 to 7 working days depending on your pincode. The estimated date is shown at checkout.",
  },
  {
    topic: "shipping",
    q: "Is there a delivery charge?",
    a: "Delivery charges, if any, are shown in your bag before you pay. Some orders qualify for free delivery.",
  },
  {
    topic: "returns",
    q: "How do I return an item?",
    a: "Go to Orders, choose the item and tap Return. Pack it in its original condition with tags, and we will arrange a pickup.",
  },
  {
    topic: "returns",
    q: "When will I get my refund?",
    a: "Refunds are issued to your original payment method after the returned item passes quality check. Banks may take a few extra days to show it.",
  },
  {
    topic: "payments",
    q: "Which payment methods do you accept?",
    a: "We accept UPI, debit and credit cards, net banking and, where available, cash on delivery.",
  },
  {
    topic: "payments",
    q: "My payment failed but money was deducted.",
    a: "Do not worry. Amounts from failed payments are usually returned to your account within 5 to 7 working days. If not, contact us with your transaction ID.",
  },
  {
    topic: "account",
    q: "How do I update my profile or address?",
    a: "Open the account menu, choose Edit profile to change your details and Saved addresses to manage delivery addresses.",
  },
  {
    topic: "account",
    q: "I forgot my password.",
    a: "On the login page choose the forgot password option and follow the steps sent to your registered email.",
  },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-800">
      {label}
    </span>
    {children}
    {error && (
      <span className="mt-1 block text-xs font-medium text-rose-600">
        {error}
      </span>
    )}
  </label>
);

const FaqItem = ({ item, isOpen, onToggle }) => (
  <div className="border-b border-slate-200 last:border-b-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-4 py-4 text-left"
    >
      <span
        className={`text-[15px] font-semibold ${isOpen ? "text-brand-700" : "text-slate-900"}`}
      >
        {item.q}
      </span>
      <FaChevronDown
        className={`shrink-0 text-xs text-slate-400 transition-transform ${isOpen ? "rotate-180 text-brand-600" : ""}`}
      />
    </button>
    {isOpen && (
      <p className="pb-5 pr-8 text-sm leading-relaxed text-slate-600">
        {item.a}
      </p>
    )}
  </div>
);

const emptyForm = {
  name: "",
  email: "",
  orderId: "",
  topic: "orders",
  message: "",
};

const HelpContact = () => {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) =>
        (topic === "all" || f.topic === topic) &&
        (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
    );
  }, [query, topic]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (form.message.trim().length < 10)
      next.message = "Tell us a little more (at least 10 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || status === "sending") return;
    setStatus("sending");
    try {
      // Change this endpoint to whatever your backend exposes for support requests.
      const res = await fetch(adminApiUrl("/support/contact"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      setForm(emptyForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-28 md:pb-16">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
            Help centre
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            How can we help?
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Find quick answers below, or reach our team. We are happy to help
            with orders, returns, payments and anything else.
          </p>

          <div className="mt-7 flex max-w-xl items-center rounded-full bg-slate-100 px-5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-300">
            <FaMagnifyingGlass className="text-sm text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenIndex(null);
              }}
              placeholder="Search for answers, e.g. refund"
              aria-label="Search help articles"
              className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {/* Contact channels */}
        <section aria-labelledby="reach-us">
          <h2 id="reach-us" className="sr-only">
            Contact us
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href={`mailto:${CONTACT.email}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-soft"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                <FaEnvelope size={15} />
              </span>
              <p className="mt-4 font-bold text-slate-900">Email us</p>
              <p className="mt-0.5 break-all text-sm text-brand-700 group-hover:underline">
                {CONTACT.email}
              </p>
              <p className="mt-2 text-xs text-slate-500">{CONTACT.replyTime}</p>
            </a>

            <a
              href={CONTACT.phoneHref}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-soft"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                <FaPhone size={15} />
              </span>
              <p className="mt-4 font-bold text-slate-900">Call us</p>
              <p className="mt-0.5 text-sm text-brand-700 group-hover:underline">
                {CONTACT.phone}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Speak to a support executive
              </p>
            </a>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                <FaClock size={15} />
              </span>
              <p className="mt-4 font-bold text-slate-900">Support hours</p>
              <p className="mt-0.5 text-sm text-slate-700">{CONTACT.hours}</p>
              <Link
                to="/orders"
                className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
              >
                Track an order instead
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
            Quick answers
          </p>
          <h2
            id="faq"
            className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl"
          >
            Frequently asked questions
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {[{ id: "all", label: "All" }, ...TOPICS].map(
              ({ id, label, icon: Icon }) => {
                const active = topic === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTopic(id);
                      setOpenIndex(null);
                    }}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700"
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    {label}
                  </button>
                );
              },
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            {visibleFaqs.length ? (
              visibleFaqs.map((item, i) => (
                <FaqItem
                  key={item.q}
                  item={item}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                No answers matched your search. Send us a message below and we
                will get back to you.
              </p>
            )}
          </div>
        </section>

        {/* Contact form */}
        <section
          aria-labelledby="message-us"
          className="grid gap-8 lg:grid-cols-[1fr_1.4fr]"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">
              Still need help?
            </p>
            <h2
              id="message-us"
              className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl"
            >
              Send us a message
            </h2>
            <p className="mt-3 text-slate-600">
              Share as much detail as you can. If your question is about an
              order, add the order ID so we can look it up faster.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            {status === "sent" ? (
              <div className="py-8 text-center" role="status">
                <FaCircleCheck className="mx-auto text-4xl text-emerald-500" />
                <p className="mt-4 text-lg font-bold text-slate-900">
                  Message sent
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Thanks for reaching out. {CONTACT.replyTime.toLowerCase()}.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-5 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-900"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" error={errors.name}>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={update("name")}
                      autoComplete="name"
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input
                      className={inputClass}
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Topic">
                    <select
                      className={inputClass}
                      value={form.topic}
                      onChange={update("topic")}
                    >
                      {TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                      <option value="other">Something else</option>
                    </select>
                  </Field>
                  <Field label="Order ID (optional)">
                    <input
                      className={inputClass}
                      value={form.orderId}
                      onChange={update("orderId")}
                      placeholder="e.g. SK123456"
                    />
                  </Field>
                </div>

                <Field label="How can we help?" error={errors.message}>
                  <textarea
                    className={`${inputClass} min-h-32 resize-y`}
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us what happened"
                  />
                </Field>

                {status === "error" && (
                  <p
                    className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    role="alert"
                  >
                    We could not send your message right now. Please try again,
                    or email us at {CONTACT.email}.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-full bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {status === "sending" ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default HelpContact;
