# Warehouse Management App

A modern, minimalist warehouse management application with real-time tracking and multi-view sharing capabilities.

## Features

- Goods management system
- Storage tracking
- Multi-view sharing for vendors and stakeholders
- Modern industrial design
- Subtle web animations
- Responsive dashboard

## Tech Stack

- Frontend: React with TypeScript
- UI Framework: Material-UI
- Animations: Framer Motion
- Backend: Node.js/Express
- Database: MongoDB
- Authentication: JWT

## Project Structure

```
warehouse-management-app/
├── client/          # React frontend application
├── server/          # Node.js backend
└── README.md        # Project documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the root directory:
```bash
cd warehouse-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Color Palette

- Primary: #2196F3 (Material Blue)
- Secondary: #1976D2 (Material Dark Blue)
- Background: #F5F5F5 (Material Light Gray)
- Text: #333333 (Dark Gray)
- Accent: #FFC107 (Material Amber)

## Font Family

- Primary: 'Inter', sans-serif
- Secondary: 'Roboto', sans-serif

## License

MIT
