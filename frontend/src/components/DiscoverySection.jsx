import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const DiscoverySection = ({ title, queryKey, values }) => {
  if (values.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 pb-5 sm:px-6 lg:px-8"
      aria-labelledby={`discover-${queryKey}`}
    >
      <h2
        id={`discover-${queryKey}`}
        className="mb-4 font-display text-xl font-medium text-slate-950"
      >
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {values.map((value) => {
          const query = new URLSearchParams({ [queryKey]: value });

          return (
            <li key={value}>
              <Link
                to={`/products?${query.toString()}`}
                className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800 motion-reduce:transition-none"
              >
                {value}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

DiscoverySection.propTypes = {
  title: PropTypes.string.isRequired,
  queryKey: PropTypes.oneOf(["occasion", "subcategory"]).isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DiscoverySection;
