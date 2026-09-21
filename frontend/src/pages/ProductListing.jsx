import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import HomeItem from "../components/HomeItem";
import { getProducts } from "../utils/productApi";
import "../styles/home.css";
import "../styles/productListing.css";

const defaultFilters = {
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  minRating: "",
  size: "",
  color: "",
  availability: "",
};

const ProductListing = ({ title = "Shop Products", initialCategory = "" }) => {
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(
    searchParams.get("search") || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: initialCategory,
  });
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts({
          page,
          limit: 12,
          sort,
          search: debouncedSearch,
          ...filters,
        });

        if (!active) {
          return;
        }

        setProducts(data.products || []);
        setPagination(data.pagination || null);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message ||
              "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [page, sort, filters, debouncedSearch]);

  const updateFilter = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));

    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      ...defaultFilters,
      category: initialCategory,
    });
    setSearchText("");
    setSort("recommended");
    setPage(1);
  };

  const changePage = (nextPage) => {
    if (nextPage >= 1 && pagination && nextPage <= pagination.totalPages) {
      setPage(nextPage);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="product-listing-page">
      <section className="product-listing-header">
        <div>
          <p className="home-eyebrow">StyleKart catalogue</p>
          <h1>{title}</h1>
          <p>
            {pagination
              ? `${pagination.total} product${
                  pagination.total === 1 ? "" : "s"
                } found`
              : "Browse the latest StyleKart picks"}
          </p>
        </div>

        <div className="product-listing-sort">
          <label htmlFor="sort-products">Sort by</label>
          <select
            id="sort-products"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>
      </section>

      <section className="product-listing-layout">
        <aside className="product-filters">
          <div className="product-filters-heading">
            <h2>Filters</h2>
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>

          <label htmlFor="product-search">Search</label>
          <input
            id="product-search"
            type="search"
            value={searchText}
            placeholder="Name, brand, category..."
            onChange={(event) => setSearchText(event.target.value)}
          />

          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            name="category"
            value={filters.category}
            onChange={updateFilter}
          >
            <option value="">All categories</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="beauty">Beauty</option>
          </select>

          <label htmlFor="filter-brand">Brand</label>
          <input
            id="filter-brand"
            name="brand"
            value={filters.brand}
            placeholder="e.g. Nike"
            onChange={updateFilter}
          />

          <div className="product-filter-price-row">
            <div>
              <label htmlFor="filter-min-price">Min price</label>
              <input
                id="filter-min-price"
                name="minPrice"
                type="number"
                min="0"
                value={filters.minPrice}
                placeholder="₹0"
                onChange={updateFilter}
              />
            </div>

            <div>
              <label htmlFor="filter-max-price">Max price</label>
              <input
                id="filter-max-price"
                name="maxPrice"
                type="number"
                min="0"
                value={filters.maxPrice}
                placeholder="₹5000"
                onChange={updateFilter}
              />
            </div>
          </div>

          <label htmlFor="filter-discount">Minimum discount</label>
          <select
            id="filter-discount"
            name="minDiscount"
            value={filters.minDiscount}
            onChange={updateFilter}
          >
            <option value="">Any discount</option>
            <option value="10">10% or more</option>
            <option value="20">20% or more</option>
            <option value="30">30% or more</option>
            <option value="50">50% or more</option>
          </select>

          <label htmlFor="filter-rating">Minimum rating</label>
          <select
            id="filter-rating"
            name="minRating"
            value={filters.minRating}
            onChange={updateFilter}
          >
            <option value="">Any rating</option>
            <option value="4">4★ and above</option>
            <option value="3">3★ and above</option>
            <option value="2">2★ and above</option>
          </select>

          <label htmlFor="filter-size">Size</label>
          <input
            id="filter-size"
            name="size"
            value={filters.size}
            placeholder="e.g. M"
            onChange={updateFilter}
          />

          <label htmlFor="filter-color">Color</label>
          <input
            id="filter-color"
            name="color"
            value={filters.color}
            placeholder="e.g. Black"
            onChange={updateFilter}
          />

          <label htmlFor="filter-availability">Availability</label>
          <select
            id="filter-availability"
            name="availability"
            value={filters.availability}
            onChange={updateFilter}
          >
            <option value="">All products</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
          </select>
        </aside>

        <section className="product-listing-results">
          {loading && (
            <div className="product-listing-skeletons">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="product-listing-skeleton" key={index} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="home-empty-state">
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button
                type="button"
                className="product-listing-retry"
                onClick={() => setPage((currentPage) => currentPage)}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="home-empty-state">
              <h2>No products found</h2>
              <p>Try changing your filters or search terms.</p>
              <button
                type="button"
                className="product-listing-retry"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="home-product-grid">
                {products.map((item) => (
                  <HomeItem key={item.id} item={item} />
                ))}
              </div>

              {pagination?.totalPages > 1 && (
                <nav className="product-pagination" aria-label="Product pages">
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => changePage(page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => changePage(page + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
};

export default ProductListing;
