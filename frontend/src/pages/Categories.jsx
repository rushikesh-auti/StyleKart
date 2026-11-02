import { Link } from "react-router-dom";

const categories = [
  {
    id: 1,
    name: "Men",
    path: "/men",
    image: "/images/categories/men.jpg",
    description: "Modern essentials for every day",
  },
  {
    id: 2,
    name: "Women",
    path: "/women",
    image: "/images/categories/women.jpg",
    description: "Fresh finds for every moment",
  },
  {
    id: 3,
    name: "Kids",
    path: "/kids",
    image: "/images/categories/kids.jpg",
    description: "Playful looks for little trendsetters",
  },
  {
    id: 4,
    name: "Beauty",
    path: "/beauty",
    image: "/images/categories/beauty.jpg",
    description: "Beauty essentials and favourites",
  },
  {
    id: 5,
    name: "GenZ",
    path: "/genz",
    image: "/images/categories/genz.jpg",
    description: "Fresh picks for every way you express yourself",
  },
];

const Categories = () => {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="sk-eyebrow">Discover StyleKart</p>
        <h1 className="sk-page-title mt-2">Shop by category</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Find fashion and beauty picks curated around the way you shop.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {categories.map((category) => (
            <Link
              key={category.id}
              to={category.path}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft motion-reduce:transition-none"
            >
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-gradient-to-br from-sand to-brand-50">
                <span className="font-display text-6xl text-brand-700">
                  {category.name.charAt(0)}
                </span>
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <div className="p-4 sm:p-5">
                <h2 className="font-display text-lg font-medium text-slate-950">
                  {category.name}
                </h2>
                <p className="mt-1 hidden text-sm leading-5 text-slate-500 sm:block">
                  {category.description}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-brand-700">
                  Shop now
                </span>
              </div>
            </Link>
        ))}
      </div>
    </main>
  );
};
export default Categories;
