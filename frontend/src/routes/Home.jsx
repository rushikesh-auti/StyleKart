import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import HomeItem from "../components/HomeItem";
import DiscoverySection from "../components/DiscoverySection";

const getUniqueProductTags = (items, selectTags) => {
  const tags = new Map();

  items.forEach((item) => {
    selectTags(item).forEach((tag) => {
      const value = String(tag || "").trim();
      if (value) tags.set(value.toLowerCase(), value);
    });
  });

  return [...tags.values()].sort((first, second) =>
    first.localeCompare(second),
  );
};

const categories = [
  {
    name: "Women",
    path: "/women",
    image: "/images/categories/women.jpg",
    description: "Fresh fashion for every moment",
  },
  {
    name: "Men",
    path: "/men",
    image: "/images/categories/men.jpg",
    description: "Everyday essentials and standout styles",
  },
  {
    name: "Kids",
    path: "/kids",
    image: "/images/categories/kids.jpg",
    description: "Big style for little trendsetters",
  },
  {
    name: "Beauty",
    path: "/beauty",
    image: "/images/categories/beauty.jpg",
    description: "Beauty picks made for you",
  },
  {
    name: "GenZ",
    path: "/genz",
    image: "/images/categories/genz.jpg",
    description: "Fresh picks for every way you express yourself",
  },
];

const ProductSection = ({ title, description, products }) => (
  <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-7 flex items-end justify-between gap-5 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:tracking-[-0.025em] [&_h2]:text-slate-950 sm:[&_h2]:text-3xl [&_div>p:last-child]:mt-2 [&_div>p:last-child]:text-sm [&_div>p:last-child]:text-slate-500">
      <div>
        <p className="sk-eyebrow">
          StyleKart selection
        </p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <Link
        to="/categories"
        className="shrink-0 text-sm font-black text-brand-700 no-underline hover:text-brand-800"
      >
        View all
      </Link>
    </div>

    {products.length > 0 ? (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {products.map((item) => (
          <HomeItem key={item.id} item={item} />
        ))}
      </div>
    ) : (
      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-500">
        <h3>New styles are on their way</h3>
        <p>Check back shortly for fresh StyleKart picks.</p>
      </div>
    )}
  </section>
);

const Home = () => {
  const items = useSelector((store) => store.items);
  const searchText = useSelector((store) => store.search);

  const normalizedSearch = searchText.trim().toLowerCase();

  const visibleItems = normalizedSearch
    ? items.filter((item) => {
        const searchableText = [
          item.item_name,
          item.company,
          item.brand,
          item.category,
          item.subcategory,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : items;

  const featuredProducts = [...visibleItems]
    .filter(
      (item) => item.rating?.stars >= 4.2 || item.discount_percentage >= 35,
    )
    .sort(
      (firstItem, secondItem) =>
        (secondItem.rating?.stars || 0) - (firstItem.rating?.stars || 0),
    )
    .slice(0, 4);

  const trendingProducts = [...visibleItems]
    .sort(
      (firstItem, secondItem) =>
        (secondItem.rating?.count || 0) - (firstItem.rating?.count || 0),
    )
    .slice(0, 4);

  const dealProducts = [...visibleItems]
    .filter((item) => item.discount_percentage > 0)
    .sort(
      (firstItem, secondItem) =>
        secondItem.discount_percentage - firstItem.discount_percentage,
    )
    .slice(0, 4);

  const recentlyAddedProducts = visibleItems.slice(0, 4);
  const occasionOptions = getUniqueProductTags(
    items,
    (item) => item.occasions || [],
  );
  const styleOptions = getUniqueProductTags(items, (item) => [
    item.subcategory,
  ]);
  if (normalizedSearch) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 [&_h1]:mt-2 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-medium [&_h1]:text-slate-950 sm:[&_h1]:text-4xl">
          <p className="sk-eyebrow">
            Search results
          </p>
          <h1>
            {visibleItems.length} product
            {visibleItems.length === 1 ? "" : "s"} for “{searchText}”
          </h1>

          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {visibleItems.map((item) => (
                <HomeItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-500">
              <h2>No products found</h2>
              <p>Try another product name, brand, or category.</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto mt-6 grid w-[calc(100%_-_2rem)] max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-sand/50 via-white to-brand-50 lg:grid-cols-2 sm:w-[calc(100%_-_3rem)]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14 [&>h1]:mt-3 [&>h1]:max-w-xl [&>h1]:font-display [&>h1]:text-4xl [&>h1]:font-medium [&>h1]:tracking-[-0.045em] [&>h1]:text-slate-950 sm:[&>h1]:text-5xl lg:[&>h1]:text-6xl [&>p:not(:first-child)]:mt-5 [&>p:not(:first-child)]:max-w-xl [&>p:not(:first-child)]:text-base [&>p:not(:first-child)]:leading-7 [&>p:not(:first-child)]:text-slate-600">
          <p className="sk-eyebrow">
            New season, new you
          </p>
          <h1>Wear your point of view.</h1>
          <p>
            Considered fashion, beauty, and everyday essentials for every way
            you show up.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/categories"
              className="sk-button-primary no-underline"
            >
              Explore the edit
            </Link>
            <Link
              to="/genz"
              className="sk-button-secondary no-underline"
            >
              Shop GenZ
            </Link>
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-gradient-to-br from-sand via-canvas to-brand-50 lg:min-h-[520px]">
          <img
            src="/images/home-fashion-hero.png"
            alt="Two models showcasing contemporary StyleKart fashion"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-5 [&_h2]:mt-2 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-[-0.025em] [&_h2]:text-slate-950 sm:[&_h2]:text-3xl [&_div>p:last-child]:mt-2 [&_div>p:last-child]:text-sm [&_div>p:last-child]:text-slate-500">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
              Find your style
            </p>
            <h2>Shop by category</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="group relative min-h-[220px] overflow-hidden rounded-2xl bg-slate-900 text-white no-underline transition-transform duration-300 after:absolute after:inset-0 after:bg-gradient-to-t after:from-slate-950/90 after:via-slate-900/20 after:to-transparent after:content-[''] hover:-translate-y-1 motion-reduce:transition-none sm:min-h-[280px] [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition [&>img]:duration-500 hover:[&>img]:scale-105 [&>.category-content]:absolute [&>.category-content]:inset-x-4 [&>.category-content]:bottom-4 [&>.category-content]:z-10 sm:[&>.category-content]:inset-x-5 sm:[>.category-content]:bottom-5 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-medium sm:[&_h3]:text-2xl [&_p]:mt-1 [&_p]:hidden [&_p]:text-sm [&_p]:leading-5 [&_p]:text-slate-200 sm:[&_p]:block [&_span]:mt-3 [&_span]:inline-block [&_span]:text-xs [&_span]:font-bold [&_span]:uppercase [&_span]:tracking-wider"
              >
                <div className="category-art absolute inset-0 grid place-items-center bg-gradient-to-br from-sand to-brand-50">
                  <strong className="font-display text-6xl font-medium text-brand-700">
                    {category.name.charAt(0)}
                  </strong>
                </div>
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span>Shop now</span>
                </div>
              </Link>
          ))}
        </div>
      </section>

      <DiscoverySection
        title="Shop by occasion"
        queryKey="occasion"
        values={occasionOptions}
      />
      <DiscoverySection
        title="Browse by style"
        queryKey="subcategory"
        values={styleOptions}
      />

      <ProductSection
        title="Featured products"
        description="Top-rated favourites and standout value picks."
        products={featuredProducts}
      />

      <ProductSection
        title="Trending now"
        description="Styles customers are loving right now."
        products={trendingProducts}
      />

      <ProductSection
        title="Best deals"
        description="More style, less spend."
        products={dealProducts}
      />

      <ProductSection
        title="Recently added"
        description="The latest additions to the StyleKart catalogue."
        products={recentlyAddedProducts}
      />

      <section className="mx-auto mt-16 flex w-[calc(100%_-_2rem)] max-w-7xl flex-col gap-8 rounded-3xl bg-slate-950 p-8 text-white sm:w-[calc(100%_-_3rem)] lg:flex-row lg:items-center lg:justify-between lg:p-12 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:tracking-[-0.03em] [&_h2]:text-white [&>div>p:last-child]:mt-2 [&>div>p:last-child]:max-w-xl [&>div>p:last-child]:text-sm [&>div>p:last-child]:leading-6 [&>div>p:last-child]:text-slate-300">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-200">
            Stay in the loop
          </p>
          <h2>Style inspiration, delivered.</h2>
          <p>Get early access to fresh arrivals and exclusive offers.</p>
        </div>

        <form
          className="flex w-full overflow-hidden rounded-xl bg-white lg:max-w-md [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:text-slate-900 [&_input]:outline-none [&_button]:bg-brand-600 [&_button]:px-5 [&_button]:text-sm [&_button]:font-black [&_button]:text-white [&_button]:hover:bg-brand-700"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Enter your email address"
            aria-label="Email address"
          />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </main>
  );
};

export default Home;
