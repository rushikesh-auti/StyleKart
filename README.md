# StyleKart

StyleKart is a full-stack fashion shopping application built with React, Express, and MongoDB. Customers can discover products, build a digital wardrobe, get outfit suggestions for different occasions and budgets, manage a personal cart and wishlist, check out with Razorpay or Cash on Delivery, and follow orders. Administrators can manage products, inventory, coupons, customers, orders, and customer-support messages.

**Live demo:** [stylekart-store.vercel.app](https://stylekart-store.vercel.app/)

## Features

### Shopping

- Browse fashion and beauty categories, search products, and filter or sort the catalogue.
- View product details, ratings, images, sizes, colors, and available stock.
- Register or sign in with email and password; Google sign-in is available when configured.
- Manage a customer-specific, MongoDB-backed cart and wishlist.
- Save and manage delivery addresses and customer profile details.
- Apply validated coupons and check out with Razorpay or Cash on Delivery.
- View order history and details, download invoices, and submit product reviews.
- Cancel eligible orders and see delivery estimates and fulfillment history.
- Maintain a personal wardrobe, request occasion- and budget-based outfit suggestions, and save outfit plans.
- Send a support request through the contact page.

### Administration

- View dashboard metrics and manage products, customers, inventory, coupons, and orders.
- Upload product images and review low-stock items.
- Advance valid order fulfillment statuses, add internal tracking references, and revise delivery estimates with a reason.
- Review support messages and update their status.
- Reconcile or retry eligible Razorpay refunds.

### Payment, orders, and inventory

- Checkout totals, coupon eligibility, product options, and stock are validated by the backend; the frontend does not determine the payable amount.
- Razorpay payments use server-created orders and server-side signature verification. Reservations expire or are released after a confirmed payment failure.
- Repeated checkout and payment-verification requests are handled idempotently.
- COD orders deduct inventory when the order is created. Paid Razorpay orders are finalized only after successful payment verification.
- Inventory is tracked by size and color, using conditional database writes to reduce overselling.
- Order cancellation restores eligible reserved stock. Paid-order refunds are tracked separately and are not marked processed until Razorpay confirms them.
- Delivery estimates use configurable calendar-day ranges. Manual tracking is not connected to a carrier.

## Preview

### Home Page

<img width="1901" height="907" alt="image" src="https://github.com/user-attachments/assets/1f53e546-8ff1-4b1d-b2e3-6c4c42b352e3" />

### Product Listing

<img width="1896" height="902" alt="image" src="https://github.com/user-attachments/assets/33d250c5-c313-49d4-b7f7-9e698c49bbbc" />


### Product Details

<img width="1896" height="906" alt="image" src="https://github.com/user-attachments/assets/98673bae-1169-4a3f-a09d-013d5a1850e9" />

### Checkout

<img width="1901" height="905" alt="image" src="https://github.com/user-attachments/assets/ccfdec4e-c154-47a0-b58e-1ffe640a6915" />

### Orders & Tracking

<img width="1896" height="906" alt="image" src="https://github.com/user-attachments/assets/0b1afea9-8a2d-4a16-b19a-ea3aecfdb3c3" />

### Wardrobe Intelligence

<img width="1897" height="907" alt="image" src="https://github.com/user-attachments/assets/89665015-5686-435f-ba91-060470c07f14" />

### Admin dashboard

<img width="1897" height="901" alt="image" src="https://github.com/user-attachments/assets/1d709753-a388-41a1-aad6-b06bb9948b59" />

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Payments | Razorpay |
| Optional services | Google Identity Services, Cloudinary |

## Project layout

```text
StyleKart/
├── backend/
│   ├── config/       # Database, Cloudinary, and delivery configuration
│   ├── controllers/  # HTTP request handlers
│   ├── middleware/   # Authentication, validation, uploads, and security
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express API routes
│   ├── scripts/      # Admin setup and inventory migration
│   ├── seed/         # Product seed script
│   ├── services/     # Checkout, inventory, refunds, delivery, wardrobe
│   ├── app.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/       # Static assets, including the StyleKart logo
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── routes/
    │   ├── store/    # Redux store and slices
    │   └── utils/
    └── package.json
```

## Run locally

### Requirements

- Node.js and npm
- MongoDB (a local replica set or MongoDB Atlas for transaction-dependent flows)
- Razorpay test credentials to test online payments

### 1. Get the code

```bash
git clone https://github.com/rushikesh-auti/StyleKart.git
cd StyleKart
```

### 2. Configure and start the backend

```bash
cd backend
npm install
```

Create `backend/.env` (the repository does not include an `.env.example` file):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/stylekart
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:5173
TRUST_PROXY=false

# Required only for Razorpay checkout
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Start the API:

```bash
npm run dev
```

The API listens on `http://localhost:5000`. Visiting `/` returns an API status response.

### 3. Configure and start the frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Environment configuration

The server loads `backend/.env` with dotenv. Required backend settings are `MONGODB_URI` and `JWT_SECRET`. Razorpay settings are required to create online payment orders; other integrations are optional.

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string. Transaction-dependent features need a replica set. |
| `JWT_SECRET` | Yes | Secret used to sign the session token. Use a strong private value. |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `NODE_ENV` | No | Set to `production` for production cookie/security behavior. |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed frontend origins. Development defaults to localhost; production should be explicitly configured. |
| `TRUST_PROXY` | No | Set to `true` only when the hosting proxy configuration requires it. |
| `JWT_EXPIRES_IN` | No | Token lifetime; defaults to `1d`. |
| `COOKIE_SAME_SITE` | No | Cookie SameSite policy; defaults to `lax`. Cross-site production deployments may require `none` over HTTPS. |
| `RAZORPAY_KEY_ID` | For Razorpay | Razorpay key ID. |
| `RAZORPAY_KEY_SECRET` | For Razorpay | Private Razorpay secret; backend only. |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google web client ID used by the backend to verify credentials. |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | For image uploads | Private Cloudinary API secret. |
| `PRODUCT_IMAGE_MAX_SIZE_MB` | No | Product image upload limit; defaults to 5 MB and is capped at 20 MB. |
| `DELIVERY_MIN_DAYS` | No | Minimum delivery estimate; defaults to 2 days. |
| `DELIVERY_MAX_DAYS` | No | Maximum delivery estimate; defaults to 4 days. |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend API base URL; defaults to `http://localhost:5000/api`. |
| `VITE_GOOGLE_CLIENT_ID` | For Google sign-in | Same Google web client ID as `GOOGLE_CLIENT_ID`. |
| `VITE_PRODUCT_IMAGE_MAX_SIZE_MB` | No | Client-side image upload limit; keep aligned with `PRODUCT_IMAGE_MAX_SIZE_MB`. |
| `VITE_DELIVERY_MIN_DAYS` | No | Frontend delivery estimate; keep aligned with the backend setting. |
| `VITE_DELIVERY_MAX_DAYS` | No | Frontend delivery estimate; keep aligned with the backend setting. |

Do not commit `.env` files or expose backend secrets in `VITE_*` variables. Google sign-in uses an OAuth web client ID, not a client secret in the frontend. Add local and deployed frontend origins to the Google client's authorized JavaScript origins.

### Optional image uploads

Configure all three Cloudinary backend credentials to enable product image uploads and wardrobe photos. Product images are uploaded through the authenticated admin endpoint `POST /api/admin/upload`, using multipart field `image`. JPEG, PNG, and WebP files are accepted; the default maximum is 5 MB (configurable up to 20 MB). The frontend limit can be set using `VITE_PRODUCT_IMAGE_MAX_SIZE_MB`.

## API overview

All endpoints are under `/api`. Customer endpoints use the authenticated customer session; administrative endpoints require an admin session.

| Area | Routes |
| --- | --- |
| Authentication | `/auth/register`, `/auth/login`, `/auth/google`, `/auth/me`, `/auth/logout` |
| Products | `GET /products`, `GET /products/:id` (catalogue filters include search, category, price, rating, size, color, availability, and sort) |
| Cart and wishlist | `/cart`, `/cart/items`, `/wishlist`, `/wishlist/items` |
| Addresses and profile | `/addresses`, `/users/profile` |
| Orders | `/orders`, `/orders/:id`, `/orders/:id/cancel`, `/orders/:id/invoice` |
| Payments | `/payments/razorpay/order`, `/payments/razorpay/verify`, `/payments/razorpay/failure` |
| Coupons and reviews | `/coupons/validate`, `/reviews/product/:productId` |
| Wardrobe | `/wardrobe`, `/wardrobe/plans`, `/wardrobe/saved`, `/wardrobe/upload` |
| Support | `/support/contact`, `/support/admin/messages` |
| Administration | `/admin/dashboard`, `/admin/orders`, `/admin/customers`, `/admin/inventory/low-stock`, `/admin/upload` |

See `backend/routes/` for the complete route definitions and accepted request fields. Product mutations, coupon management, and order administration are protected.

## Inventory migration

For an existing database, review the inventory migration in dry-run mode before applying it. Stop the application and all inventory writes during migration, and do not run old and new application versions against the database at the same time.

```bash
cd backend
npm run migrate:inventory
```

Apply only after reviewing the dry-run output and backing up the database:

```powershell
$env:MONGODB_MIGRATION_CONFIRM = "MIGRATE_STYLEKART_INVENTORY"
npm run migrate:inventory -- --apply
```

The migration preserves stock for products without variants in a default inventory row. For products with size/color options, it records legacy aggregate stock for an administrator to allocate rather than guessing variant quantities. The inventory reservation cleanup worker starts with the backend. MongoDB transactions (and therefore the reservation/finalization flows) require a replica set; MongoDB Atlas provides this.

## Development scripts

### Backend (`backend/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with nodemon. |
| `npm start` | Start the API. |
| `npm test` | Run backend tests with Node's test runner. |
| `npm run seed` | Seed products from the backend seed script. |
| `npm run create-admin` | Run the admin account setup script. |
| `npm run migrate:inventory` | Preview or explicitly apply the inventory migration. |

### Frontend (`frontend/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production frontend build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

## Deployment

The frontend can be deployed to Vercel, the API to a Node.js host such as Render, and the database to MongoDB Atlas. Configure environment variables in the hosting provider rather than committing secrets.

- Set `VITE_API_URL` to the deployed API base URL, ending in `/api`.
- Set backend `CORS_ORIGINS` to the exact deployed frontend origin(s).
- Use HTTPS, production MongoDB, and production Razorpay credentials only after testing.
- Set `NODE_ENV=production`; configure `TRUST_PROXY=true` only when required by the host.
- For cross-site frontend/API hosting, configure `COOKIE_SAME_SITE=none` over HTTPS. Browser third-party-cookie restrictions may still affect sessions; hosting both services on the same site can avoid that issue.
- Configure Google authorized origins and matching client IDs if Google sign-in is enabled.
- Provide Cloudinary credentials if admin product image or customer wardrobe image uploads are enabled.

## Developer and Maintainer

**Rushikesh Auti**

---

⭐ If you found this project useful, please consider **starring the repository** on GitHub!
