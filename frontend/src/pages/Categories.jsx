import { Link } from "react-router-dom";

const categories = [
  {
    id: 1,
    name: "Men",
    image: "/images/categories/men.jpg",
    path: "/men",
  },
  {
    id: 2,
    name: "Women",
    image: "/images/categories/women.jpg",
    path: "/women",
  },
  {
    id: 3,
    name: "Kids",
    image: "/images/categories/kids.jpg",
    path: "/kids",
  },
  {
    id: 4,
    name: "Beauty",
    image: "/images/categories/beauty.jpg",
    path: "/beauty",
  },
];

const Categories = () => {
  return (
    <div className="container py-4">
      <h2 className="text-center fw-bold mb-4">Shop by Category</h2>

      <div className="row g-4">
        {categories.map((category) => (
          <div className="col-6 col-md-3" key={category.id}>
            <Link
              to={category.path}
              className="text-decoration-none text-dark"
            >
              <div className="card border-0 shadow-sm h-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="card-img-top"
                  style={{
                    height: "250px",
                    objectFit: "cover",
                  }}
                />

                <div className="card-body text-center">
                  <h5 className="fw-bold">{category.name}</h5>

                  <button className="btn btn-dark btn-sm">
                    Shop Now
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;