# Bucket List Backend API

A comprehensive Node.js backend API for a bucket list application with MongoDB integration.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Space Management**: Create and organize multiple bucket list spaces
- **Category Management**: Organize items into customizable categories
- **Item Management**: Full CRUD operations for bucket list items
- **External APIs**: Integration with TMDB (movies) and OpenLibrary (books)
- **Sync & Backup**: Data synchronization and backup/restore functionality
- **Statistics**: Track progress and completion rates
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Comprehensive error handling and validation

## 📁 Project Structure

```
backendbucket/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── spaceController.js   # Space management
│   │   ├── categoryController.js # Category management
│   │   ├── itemController.js    # Item management
│   │   ├── externalController.js # External API integrations
│   │   ├── syncController.js    # Sync and backup
│   │   └── statsController.js   # Statistics
│   ├── middlewares/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validate.js          # Request validation
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── UserPreferences.js   # User preferences
│   │   ├── Space.js             # Space model
│   │   ├── Category.js          # Category model
│   │   └── Item.js              # Item model
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── spaceRoutes.js       # Space endpoints
│   │   ├── categoryRoutes.js    # Category endpoints
│   │   ├── itemRoutes.js        # Item endpoints
│   │   ├── externalRoutes.js    # External API endpoints
│   │   ├── syncRoutes.js        # Sync endpoints
│   │   └── statsRoutes.js       # Stats endpoints
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   └── server.js                # Main server file
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- TMDB API key (for movie search)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# External API Keys
TMDB_API_KEY=your-tmdb-api-key
```

### Step 3: Get Required API Keys

#### MongoDB Atlas (Free Online MongoDB)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (Free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `myFirstDatabase` with your database name (e.g., `bucketlist`)
8. Paste the complete URI in your `.env` file as `MONGODB_URI`

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/bucketlist?retryWrites=true&w=majority
```

#### TMDB API Key (For Movie Search)

1. Go to [TMDB](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Fill out the form (you can use personal/educational purpose)
6. Copy the API Key (v3 auth)
7. Paste it in your `.env` file as `TMDB_API_KEY`

**Note**: OpenLibrary doesn't require an API key!

### Step 4: Run the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

Base URL: `http://localhost:5000/api/v1`

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile (Protected)
- `PATCH /auth/preferences` - Update preferences (Protected)

### Space Endpoints

- `GET /spaces` - Get all spaces
- `GET /spaces/:spaceId` - Get single space
- `POST /spaces` - Create space
- `PUT /spaces/:spaceId` - Update space
- `PATCH /spaces/:spaceId/visibility` - Toggle visibility
- `PATCH /spaces/reorder` - Reorder spaces
- `DELETE /spaces/:spaceId` - Delete space

### Category Endpoints

- `GET /spaces/:spaceId/categories` - Get all categories
- `GET /spaces/:spaceId/categories/:categoryId` - Get single category
- `POST /spaces/:spaceId/categories` - Create category
- `PUT /spaces/:spaceId/categories/:categoryId` - Update category
- `PATCH /spaces/:spaceId/categories/:categoryId/visibility` - Toggle visibility
- `PATCH /spaces/:spaceId/categories/reorder` - Reorder categories
- `DELETE /spaces/:spaceId/categories/:categoryId` - Delete category

### Item Endpoints

- `GET /spaces/:spaceId/items` - Get all items
- `GET /spaces/:spaceId/items/:itemId` - Get single item
- `POST /spaces/:spaceId/items` - Create item
- `PUT /spaces/:spaceId/items/:itemId` - Update item
- `PATCH /spaces/:spaceId/items/:itemId/toggle` - Toggle completion
- `PATCH /spaces/:spaceId/items/:itemId/move` - Move to category
- `DELETE /spaces/:spaceId/items/:itemId` - Delete item

### External API Endpoints

- `GET /external/movies/search?query=inception` - Search movies
- `GET /external/books/search?query=1984` - Search books

### Sync & Stats Endpoints

- `POST /sync` - Sync data
- `GET /backup` - Get backup
- `POST /backup/restore` - Restore backup
- `GET /stats` - Get statistics

For detailed API documentation, refer to the original `bbb.txt` file.

## 🔐 Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🧪 Testing the API

You can test the API using:
- **Postman**: Import the endpoints and test
- **Thunder Client** (VS Code extension)
- **cURL**: Command line testing
- **Your Flutter app**: Connect your frontend

Example cURL request:
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | 7d |
| `TMDB_API_KEY` | TMDB API key | Yes (for movies) | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | No | 60000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | 100 |
| `CORS_ORIGIN` | Allowed CORS origins | No | * |

## 🚨 Common Issues & Solutions

### MongoDB Connection Error
- Ensure your IP is whitelisted in MongoDB Atlas
- Check if the connection string is correct
- Verify database user credentials

### TMDB API Not Working
- Verify your API key is correct
- Check if you've exceeded the rate limit
- Ensure the API key is for v3 (not v4)

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using port 5000

## 📄 License

ISC

## 👨‍💻 Support

For issues and questions, please refer to the API documentation in `bbb.txt`.
