import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import HomeItem from "../components/HomeItem";
import { getProducts } from "../utils/productApi";

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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.035em] [&_h1]:text-slate-950 sm:[&_h1]:text-4xl [&>div>p:last-child]:mt-2 [&>div>p:last-child]:text-sm [&>div>p:last-child]:text-slate-500">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
            StyleKart catalogue
          </p>
          <h1>{title}</h1>
          <p>
            {pagination
              ? `${pagination.total} product${
                  pagination.total === 1 ? "" : "s"
                } found`
              : "Browse the latest StyleKart picks"}
          </p>
        </div>

        <div className="flex items-center gap-3 [&_label]:text-xs [&_label]:font-black [&_label]:text-slate-600 [&_select]:min-w-[180px] [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm">
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

      <section className="grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1 [&_label]:text-xs [&_label]:font-black [&_label]:text-slate-600 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2.5 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:px-3 [&_select]:py-2.5">
          <div className="col-span-full mb-1 flex items-center justify-between [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-slate-950 [&_button]:bg-transparent [&_button]:text-xs [&_button]:font-black [&_button]:text-brand-700">
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

          <div className="grid grid-cols-2 gap-2 [&_div]:grid [&_div]:gap-2">
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

        <section className="min-w-0">
          {loading && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  className="min-h-[300px] animate-pulse rounded-2xl bg-slate-200 sm:min-h-[390px]"
                  key={index}
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-500">
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
                onClick={() => setPage((currentPage) => currentPage)}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-950 [&_p]:mt-2 [&_p]:text-sm [&_p]:text-slate-500">
              <h2>No products found</h2>
              <p>Try changing your filters or search terms.</p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                {products.map((item) => (
                  <HomeItem key={item.id} item={item} />
                ))}
              </div>

              {pagination?.totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-center gap-3 [&_button]:rounded-xl [&_button]:bg-slate-950 [&_button]:px-4 [&_button]:py-2.5 [&_button]:text-sm [&_button]:font-black [&_button]:text-white [&_button:disabled]:bg-slate-100 [&_button:disabled]:text-slate-400 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500"
                  aria-label="Product pages"
                >
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
