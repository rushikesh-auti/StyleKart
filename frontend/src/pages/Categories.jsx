import { Link } from "react-router-dom";

const categories = [
  {
    id: 1,
    name: "Men",
    image: "/images/categories/men.jpg",
    path: "/men",
    description: "Smart everyday menswear",
  },
  {
    id: 2,
    name: "Women",
    image: "/images/categories/women.jpg",
    path: "/women",
    description: "Fresh styles for every moment",
  },
  {
    id: 3,
    name: "Kids",
    image: "/images/categories/kids.jpg",
    path: "/kids",
    description: "Playful looks for little trendsetters",
  },
  {
    id: 4,
    name: "Beauty",
    image: "/images/categories/beauty.jpg",
    path: "/beauty",
    description: "Beauty essentials and favourites",
  },
];

const Categories = () => (
  <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-8 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
        Discover StyleKart
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl">
        Shop by category
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Find fashion and beauty picks curated around the way you shop.
      </p>
    </div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={category.path}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
        >
          <div className="aspect-[4/5] overflow-hidden bg-slate-100">
            <img
              src={category.image}
              alt={category.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-4 sm:p-5">
            <h2 className="text-lg font-black text-slate-950">
              {category.name}
            </h2>
            <p className="mt-1 hidden text-sm leading-5 text-slate-500 sm:block">
              {category.description}
            </p>
            <span className="mt-4 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white group-hover:bg-brand-600">
              Shop now
            </span>
          </div>
        </Link>
      ))}
    </div>
  </main>
);
export default Categories;
