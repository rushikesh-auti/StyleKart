# StyleKart

A modern full-stack fashion e-commerce platform built using **React.js, Vite, Node.js, Express.js, MongoDB, Redux Toolkit, Tailwind CSS, and Razorpay**. StyleKart enables users to discover fashion products, manage their wishlist and shopping bag, securely checkout using Razorpay or Cash on Delivery, track orders, write reviews, and manage their profiles through a responsive and user-friendly interface.

---

## Live Demo

https://stylekart-store.vercel.app/
---

## Overview

StyleKart is a full-stack fashion e-commerce platform designed to provide a complete online shopping experience.

Users can browse products by category, search and filter products, select product variants such as size and color, manage their wishlist and shopping bag, save delivery addresses, apply coupons, complete secure payments, track orders, and submit product reviews.

The application uses a **MongoDB-backed user-specific cart**, ensuring that every authenticated customer has their own persistent shopping cart.

StyleKart also includes an **admin dashboard** for managing products, inventory, customers, coupons, and orders.

The application follows a modern frontend and backend architecture with **server-side validation**, **role-based access control**, **secure authentication**, and a **server-authoritative Razorpay payment flow**.

---

## Features

### User Features

- Secure user registration and login
- Browse fashion products
- Browse products by category
- Product search
- Product filtering
- Product sorting
- View detailed product information
- Select required size and color variants
- Add products to wishlist
- Remove products from wishlist
- Add products to shopping bag
- Update cart quantities
- Remove products from cart
- Clear shopping cart
- Persistent user-specific shopping cart
- Cart persistence across page refreshes and login sessions
- Save delivery addresses
- Multi-step checkout
- Apply and validate coupons
- Server-side price calculation
- Server-side stock validation
- Cash on Delivery
- Razorpay payment integration
- UPI payments
- Card payments
- Net banking
- Supported Razorpay wallets
- View order history
- View order details
- Track orders
- Write product reviews
- Submit product ratings
- Responsive and mobile-friendly interface

### Admin Features

- Admin dashboard
- Product management
- Add products
- Edit products
- Manage product inventory
- Manage product stock
- Customer management
- Coupon management
- Order management
- Update order status
- Role-protected admin routes

### Core Features

- Cookie-based authentication
- JWT authentication
- Customer and admin roles
- Role-based access control
- MongoDB-backed persistent cart
- Secure Razorpay payment verification
- Server-authoritative checkout
- Idempotent Razorpay payment verification
- Server-side order validation
- Inventory and stock management
- Coupon validation
- Responsive UI
- Tailwind CSS styling
- REST API architecture
- Environment-based configuration
- Security middleware with Helmet
- Configurable CORS

---

## Technologies Used

### Frontend

- React.js
- Vite
- JavaScript (ES6+)
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- React Icons
- Fetch API

### Backend

- Node.js
- Express.js
- JWT
- Razorpay Node SDK
- Helmet
- CORS

### Database

- MongoDB
- Mongoose
- MongoDB Atlas

### Services & Tools

- Razorpay
- Git
- GitHub
- VS Code
- Vercel
- Render

---

## Razorpay Payment Flow

StyleKart uses a **server-authoritative payment architecture** to prevent the frontend from controlling the final order amount.

```text
Customer
   │
   ▼
Frontend Checkout
   │
   ├── Product IDs
   ├── Quantities
   ├── Selected Variants
   ├── Address ID
   └── Coupon Code
   │
   ▼
Backend Validation
   │
   ├── Load Products
   ├── Validate Variants
   ├── Validate Stock
   ├── Calculate Prices
   ├── Validate Coupon
   └── Calculate Delivery Charge
   │
   ▼
Create Razorpay Order
   │
   ▼
Razorpay Checkout
   │
   ▼
Payment Completed
   │
   ▼
Backend Signature Verification
   │
   ▼
Create Paid Order
   │
   ▼
Reduce Product Stock
   │
   ▼
Clear Shopping Cart
```

### Payment Security

**Never expose `RAZORPAY_KEY_SECRET` in the frontend.**

The Razorpay secret key is stored only on the backend.

The backend:

- Recalculates the order amount
- Validates product availability
- Validates selected variants
- Validates stock
- Validates coupons
- Creates the Razorpay order
- Verifies the Razorpay signature
- Creates the paid order only after successful verification
- Reduces stock after successful order finalization
- Handles repeated verification idempotently

---

## Cart Architecture

StyleKart uses a **MongoDB-backed cart associated with the authenticated customer**.

```text
Login
  │
  ▼
Authenticated Customer
  │
  ▼
MongoDB Cart
  │
  ├── Add Item
  ├── Update Quantity
  ├── Remove Item
  ├── Clear Cart
  └── Fetch Cart
  │
  ▼
Checkout
  │
  ├── Cash on Delivery
  └── Razorpay
  │
  ▼
Successful Order
  │
  ▼
Clear Cart
```

Each customer has an independent cart, preventing users from accessing or modifying another customer's shopping cart.

---

## Payment & Order APIs

| Method | Endpoint                        | Purpose                                     |
| ------ | ------------------------------- | ------------------------------------------- |
| `POST` | `/api/payments/razorpay/order`  | Validate checkout and create Razorpay order |
| `POST` | `/api/payments/razorpay/verify` | Verify payment and create paid order        |
| `POST` | `/api/orders`                   | Create Cash on Delivery order               |

Both Razorpay endpoints require an authenticated customer session.

---

## Project Structure

```text
StyleKart/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── seed/
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── screenshots/
│   ├── home.png
│   ├── products.png
│   ├── product-details.png
│   ├── bag.png
│   ├── wishlist.png
│   ├── checkout.png
│   ├── orders.png
│   └── admin-dashboard.png
│
└── README.md
```

---

## Preview

### Home Page

<img width="1896" height="912" alt="image" src="https://github.com/user-attachments/assets/1d24c879-8029-4c16-ae1f-7ee817ca5e5a" />

### Product Listing

<img width="1897" height="905" alt="image" src="https://github.com/user-attachments/assets/07f1df02-4301-4961-9d6e-5509baff8d11" />

### Product Details

<img width="1900" height="911" alt="image" src="https://github.com/user-attachments/assets/3eef8eca-9264-44ee-b2bc-cb0a07f5c390" />

### Shopping Bag

<img width="1900" height="905" alt="image" src="https://github.com/user-attachments/assets/88bf4d72-aec7-4a33-8e8c-1ad2bac98b63" />

### Wishlist

<img width="1901" height="910" alt="image" src="https://github.com/user-attachments/assets/08062b30-8a63-45c6-b096-2b9fc5160d9b" />

### Checkout

<img width="1902" height="890" alt="image" src="https://github.com/user-attachments/assets/6b5a630a-11ce-4da1-9d0c-e92ff230909f" />

### Orders & Tracking

<img width="1902" height="912" alt="image" src="https://github.com/user-attachments/assets/c882dfaf-f248-4038-86d8-bcfbd9f04900" />

### Admin Dashboard

<img width="1901" height="907" alt="image" src="https://github.com/user-attachments/assets/655fb2e3-e5c0-4222-bcc6-5950c36bf80c" />

---

## Getting Started

### Prerequisites

Before running this project, make sure you have installed:

- Node.js
- npm
- MongoDB / MongoDB Atlas
- Razorpay account for payment testing

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/rushikesh-auti/StyleKart.git
```

Navigate to the project folder:

```bash
cd StyleKart
```

---

### Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example`.

```env
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/stylekart

JWT_SECRET=your_long_random_secret

CORS_ORIGINS=http://localhost:5173

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

TRUST_PROXY=false

NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### Optional Commands

Seed the database:

```bash
npm run seed
```

Create an admin account:

```bash
npm run create-admin
```

---

### Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
CORS_ORIGINS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
TRUST_PROXY=false
NODE_ENV=development
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

### Security

Never commit your `.env` file to GitHub.

Do not expose:

- JWT secrets
- MongoDB credentials
- Razorpay secret keys
- Private API credentials

Use `.env.example` to document required environment variables.

---

## Usage

### Customers

- Register or log in securely.
- Browse products by category.
- Search, filter, and sort products.
- View detailed product information.
- Select size and color variants.
- Add products to the wishlist.
- Add products to the shopping bag.
- Update or remove cart items.
- Save delivery addresses.
- Apply available coupons.
- Complete checkout.
- Pay using Razorpay or Cash on Delivery.
- View order history.
- Track orders.
- Submit product reviews and ratings.

### Admin

- Access the admin dashboard.
- Add and manage products.
- Update product information.
- Manage inventory and stock.
- Manage customers.
- Create and manage coupons.
- View and manage orders.
- Update order status.

---

## Tailwind CSS

StyleKart uses **Tailwind CSS for the entire frontend UI**.

The project does not use Bootstrap or page-specific custom CSS stylesheets.

The main `frontend/src/index.css` contains:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

All component-level visual styling is implemented using Tailwind utility classes.

---

## Database

StyleKart uses **MongoDB with Mongoose** for persistent application data.

The database stores:

- Users
- Products
- Categories
- Product variants
- Carts
- Wishlists
- Addresses
- Coupons
- Orders
- Reviews
- Ratings

Paid-order finalization uses MongoDB transactions.

> MongoDB transactions require a replica set. MongoDB Atlas supports replica-set deployments.

---

## Deployment

### Frontend

- Vercel

### Backend

- Render

### Database

- MongoDB Atlas

### Payments

- Razorpay

---

## Production Configuration

### Backend

Set:

```env
NODE_ENV=production
```

Configure your deployed frontend URL:

```env
CORS_ORIGINS=https://stylekart-store.vercel.app
```

Use:

- Production MongoDB
- Production Razorpay credentials
- HTTPS
- Strong JWT secret
- Secure cookie configuration
- Appropriate `TRUST_PROXY` configuration

Example:

```env
TRUST_PROXY=true
```

Only enable `TRUST_PROXY` when required by your hosting infrastructure.

### Frontend

Configure the deployed backend API:

```env
VITE_API_URL=https://your-stylekart-backend.onrender.com/api
```

Replace the example URL with your actual deployed backend URL.

---

## Developer

**Rushikesh Auti**

---

⭐ If you found this project useful, please consider **starring the repository** on GitHub!
