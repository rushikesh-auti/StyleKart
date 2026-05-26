# StyleKart

A modern e-commerce fashion application inspired by Myntra, built using ReactJS and ExpressJS. This project demonstrates efficient state management using Redux Toolkit and provides a responsive shopping experience with product browsing and cart management functionality.

## Overview

StyleKart is an online fashion shopping platform that allows users to browse products and manage shopping items through a clean and responsive interface. The application follows a component-based architecture and centralized state management for scalability and maintainability.

## Features

- Browse fashion products
- Add products to shopping bag/cart
- Remove items from bag
- Dynamic cart item count
- Real-time UI updates
- Responsive user interface
- State management using Redux Toolkit
- Backend API integration
- Loading state handling

## Technologies

### Frontend
- ReactJS
- JavaScript
- Bootstrap 5
- Redux Toolkit

### Backend
- Node.js
- ExpressJS

## Project Structure

```bash
StyleKart/
│
├── backend/
│   ├── app.js
│   ├── package.json
│
├── myntra-react-clone/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── HomeItem.jsx
│   │   │   ├── BagItem.jsx
│   │   │   ├── BagSummary.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Fetchitems.jsx
│   │   │
│   │   ├── routes/
│   │   │   ├── Home.jsx
│   │   │   ├── Bag.jsx
│   │   │   └── App.jsx
│   │   │
│   │   ├── store/
│   │   │   ├── bagSlice.js
│   │   │   ├── itemsSlice.js
│   │   │   ├── fetchStatusSlice.js
│   │   │   └── index.js
│   │   │
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or above recommended)
- npm

## Installation

### Clone repository

```bash
git clone https://github.com/rushikesh-auti/StyleKart.git
```

### Navigate to project folder

```bash
cd StyleKart
```

### Install frontend dependencies

```bash
cd myntra-react-clone
npm install
```

### Install backend dependencies

```bash
cd ../backend
npm install
```

## Running the Application

### Start backend server

```bash
cd backend
npm start
```

### Start frontend

Open another terminal:

```bash
cd myntra-react-clone
npm run dev
```

Open browser and visit:

```bash
http://localhost:5173
```

## Usage

- Browse available products
- Add products to shopping bag
- View cart summary
- Remove products from bag
- Navigate through product pages

## Future Enhancements

- User authentication system
- Wishlist functionality
- Payment gateway integration
- Product search and filters
- Order history page
- Dark mode support
- Product reviews and ratings


