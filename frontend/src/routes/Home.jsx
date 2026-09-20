import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import HomeItem from "../components/HomeItem";
import "../styles/home.css";

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
];

const ProductSection = ({ title, description, products }) => (
  <section className="home-section">
    <div className="home-section-heading">
      <div>
        <p className="home-eyebrow">StyleKart selection</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <Link to="/categories" className="home-view-all">
        View all
      </Link>
    </div>

    {products.length > 0 ? (
      <div className="home-product-grid">
        {products.map((item) => (
          <HomeItem key={item.id} item={item} />
        ))}
      </div>
    ) : (
      <div className="home-empty-state">
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
      (item) =>
        item.rating?.stars >= 4.2 ||
        item.discount_percentage >= 35,
    )
    .sort(
      (firstItem, secondItem) =>
        (secondItem.rating?.stars || 0) -
        (firstItem.rating?.stars || 0),
    )
    .slice(0, 4);

  const trendingProducts = [...visibleItems]
    .sort(
      (firstItem, secondItem) =>
        (secondItem.rating?.count || 0) -
        (firstItem.rating?.count || 0),
    )
    .slice(0, 4);

  const dealProducts = [...visibleItems]
    .filter((item) => item.discount_percentage > 0)
    .sort(
      (firstItem, secondItem) =>
        secondItem.discount_percentage -
        firstItem.discount_percentage,
    )
    .slice(0, 4);

  const recentlyAddedProducts = visibleItems.slice(0, 4);

  if (normalizedSearch) {
    return (
      <main className="home-page">
        <section className="home-search-results">
          <p className="home-eyebrow">Search results</p>
          <h1>
            {visibleItems.length} product
            {visibleItems.length === 1 ? "" : "s"} for “{searchText}”
          </h1>

          {visibleItems.length > 0 ? (
            <div className="home-product-grid">
              {visibleItems.map((item) => (
                <HomeItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="home-empty-state">
              <h2>No products found</h2>
              <p>Try another product name, brand, or category.</p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-eyebrow">New season, new you</p>
          <h1>Discover your next favourite style.</h1>
          <p>
            Explore hand-picked fashion, beauty, and everyday essentials
            for the whole family.
          </p>

          <div className="home-hero-actions">
            <Link to="/categories" className="home-primary-action">
              Shop Now
            </Link>
            <Link to="/women" className="home-secondary-action">
              Explore Women
            </Link>
          </div>
        </div>

        <div className="home-hero-image-wrap">
          <img
            src="/images/categories/women.jpg"
            alt="StyleKart seasonal fashion collection"
            className="home-hero-image"
          />
        </div>
      </section>

      <section className="home-category-section">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">Find your style</p>
            <h2>Shop by category</h2>
          </div>
        </div>

        <div className="home-category-grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              className="home-category-card"
            >
              <img src={category.image} alt={category.name} />
              <div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span>Shop now</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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

      <section className="home-newsletter">
        <div>
          <p className="home-eyebrow">Stay in the loop</p>
          <h2>Style inspiration, delivered.</h2>
          <p>
            Get early access to fresh arrivals and exclusive offers.
          </p>
        </div>

        <form
          className="home-newsletter-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="newsletter-email" className="visually-hidden">
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