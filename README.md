# StyleKart – Fashion E-commerce Web Application

A modern full-stack fashion e-commerce application built using **React.js**, **Node.js**, **Express.js**, and **MongoDB**. The application enables users to browse fashion products, search items, manage their wishlist and shopping cart, and retrieve product data through RESTful APIs with persistent database storage.

---

## Live Demo

https://stylekart-store.vercel.app/

---

## Overview

StyleKart is a full-stack MERN fashion e-commerce application inspired by modern online shopping platforms. It provides a responsive shopping experience with dynamic product listing, category browsing, search functionality, wishlist management, and shopping cart features. The application follows the MVC architecture on the backend and uses Redux Toolkit for efficient state management, ensuring scalability, maintainability, and a seamless user experience.

---

## Features

- Browse fashion products
- Product details page
- Category-wise product browsing
- Product search functionality
- Wishlist management
- Shopping cart management
- Dynamic product data from MongoDB
- Redux Toolkit state management
- RESTful API integration
- Responsive and mobile-friendly UI
- Persistent database storage

---

## Technologies Used

### Frontend

- React.js
- JavaScript (ES6+)
- Redux Toolkit
- React Router DOM
- Bootstrap
- Vite
- Fetch API

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose

### Development Tools

- Git
- GitHub
- VS Code
- MongoDB Compass
- Render
- Vercel

---

## Project Structure

```text
StyleKart/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   └── productController.js
│   │
│   ├── models/
│   │   └── Product.js
│   │
│   ├── routes/
│   │   └── productRoutes.js
│   │
│   ├── public/
│   │   └── images/
│   │
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── Components/
│   │   ├── Store/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

---

## Preview

<img width="1877" height="910" alt="image" src="https://github.com/user-attachments/assets/f24c49b8-75d8-4bbf-85da-3ec9ae9d1b1d" />

---

## Getting Started

### Prerequisites

Before running this project, ensure you have installed:

- Node.js (v18 or above)
- npm
- MongoDB Atlas account

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/rushikesh-auti/StyleKart.git
```

Navigate to the project folder

```bash
cd StyleKart
```

---

### Backend Setup

Navigate to backend

```bash
cd backend
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start backend server

```bash
npm start
```

---

### Frontend Setup

Open another terminal

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Start frontend

```bash
npm run dev
```

Open your browser

```
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Retrieve all products |
| GET | `/api/products/:id` | Retrieve a single product |

---

## Usage

- Browse fashion products
- Search products
- View product details
- Add products to wishlist
- Manage shopping cart
- Experience responsive shopping across desktop and mobile devices

---

## Deployment

### Frontend

- Vercel

### Backend

- Render

### Database

- MongoDB Atlas

---

## Future Enhancements

- Product CRUD (Admin Dashboard)
- User Authentication (JWT)
- Order Management
- Payment Gateway Integration
- Product Reviews & Ratings
- Inventory Management
- Search & Advanced Filters
- Dark Mode
- Progressive Web App (PWA)
- Unit & Integration Testing