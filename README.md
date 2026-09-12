# Blog_Xp

Blog_Xp is a full-stack content publishing web platform built with Node.js, Express, MongoDB, and EJS. The application provides server-side rendering, media upload management (images and HTML5 video), user authentication via JSON Web Tokens stored in HTTP-only cookies, author profiles, full-text and author search, and a modular REST API.

## Features

- User Authentication: Secure registration, login, and session persistence using JWT stored in HTTP-only cookies, with password hashing handled by bcryptjs.
- Role and Ownership Access Control: Article creation, editing, and deletion restricted to verified authors and administrators.
- Rich Media Support: Integrated file upload pipeline via Multer supporting both image formats and video streaming with thumbnail generation and in-browser playback.
- Dynamic Feed and Search: Paginated feed with progressive batch reveal, keyword filtering across titles and content, tag filtering, and author lookups using @username syntax.
- User Profiles and Settings: Customizable account details, avatar selection from pre-bundled assets, custom image uploads, and an author-specific management dashboard.
- Hybrid Architecture: Server-side rendered views using EJS templates alongside a decoupled JSON REST API.
- Database Lifecycle Management: Mongoose schema definitions with pre-save hooks for automated excerpt extraction, indexing, and cascade handling.

## Technology Stack

- Runtime: Node.js (version 18 or higher recommended)
- Framework: Express.js (version 5)
- Database: MongoDB with Mongoose ODM (version 9)
- View Engine: EJS (Embedded JavaScript templates)
- Authentication: JSON Web Tokens (jsonwebtoken) with bcryptjs
- File Uploads: Multer
- Styling: Custom Vanilla CSS with responsive layout design

## Directory Structure

```
Blog_Xp/
├── app.js                   # Application entry point and server configuration
├── package.json             # Project dependencies and operational scripts
├── .env.example             # Template for required environment variables
├── config/
│   └── db.js                # MongoDB connection handler and lifecycle events
├── controllers/
│   ├── authController.js    # API authentication logic (register, login, me)
│   ├── blogController.js    # API CRUD operations for articles
│   └── viewController.js    # Web view routing and form submission handlers
├── middlewares/
│   ├── authMiddleware.js    # JWT verification, cookie extraction, route protection
│   └── uploadMiddleware.js  # Multer disk storage and file validation config
├── models/
│   ├── Blog.js              # Mongoose schema for blog posts and media metadata
│   └── User.js              # Mongoose schema for user accounts and credentials
├── routes/
│   ├── authRoutes.js        # REST endpoints for authentication
│   ├── blogRoutes.js        # REST endpoints for blog data
│   └── viewRoutes.js        # Web view routes and page rendering
├── scripts/
│   └── seed200Blogs.js      # Seeding script for automated test data generation
├── utils/
│   └── jwt.js               # Token signing, cookie configuration, and verification
├── views/
│   ├── pages/               # EJS page templates (home, login, blog-detail, etc.)
│   └── partials/            # Reusable interface components (navbar, footer, header)
└── public/
    ├── css/                 # Global stylesheet and UI variables
    ├── images/              # Default avatars and static graphic assets
    ├── js/                  # Client-side interactivity and utilities
    └── uploads/             # Destination directory for user-uploaded media
```

## Prerequisites

Before running the application, ensure the following dependencies are installed on your host system:

- Node.js (version 18.0.0 or higher)
- npm (version 9.0.0 or higher)
- MongoDB Community Server (version 6.0 or higher) running locally or a hosted MongoDB Atlas connection URI

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd Blog_Xp
   ```

2. Install all required dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Configure the environment variables inside `.env`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/blog_xp
   JWT_SECRET=your_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

## Environment Variables

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Network port for the HTTP server | `3000` |
| `MONGO_URI` | Connection URI for the MongoDB instance | `mongodb://127.0.0.1:27017/blog_xp` |
| `JWT_SECRET` | Secret key used for signing and verifying tokens | Configured in `.env` |
| `JWT_EXPIRES_IN` | Duration before issued JWT tokens expire | `7d` |

## Database Seeding

The project includes an automated seeding script that generates 30 unique user accounts and 200 diverse articles equipped with images and videos across multiple technical domains.

To run the seeding script:
```bash
npm run seed
```

Default credentials generated for test users:
- Password for all seeded users: `password123`
- Example accounts: `alex_coder`, `sarah_dev`, `marcus_tech`, `priya_ai`

## Running the Application

### Development Mode
Runs the application with the native Node.js file watcher:
```bash
npm run dev
```

### Production Mode
Starts the server instance directly:
```bash
npm start
```

Once started, access the application by opening your web browser at:
`http://localhost:3000`

A health check probe endpoint is available at:
`http://localhost:3000/api/health`

## API Reference

### Authentication Endpoints (/api/auth)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and set HTTP-only cookie |
| `GET` | `/api/auth/logout` | Public | Invalidate session and clear cookie |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |

### Blog Endpoints (/api/blogs)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/blogs` | Public | Retrieve all articles (supports query params `search` and `tag`) |
| `GET` | `/api/blogs/:id` | Public | Retrieve a specific article by ObjectId |
| `POST` | `/api/blogs` | Private | Create and publish a new article |
| `PUT` | `/api/blogs/:id` | Private | Update an article (Author or Admin only) |
| `DELETE` | `/api/blogs/:id` | Private | Delete an article (Author or Admin only) |

## Web Page Routes

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | Public | Main feed displaying articles with search and filtering |
| `/blogs/:id` | `GET` | Public | Full article view with media player or image |
| `/blogs/create` | `GET`, `POST` | Private | Article editor and publication form |
| `/blogs/:id/edit` | `GET`, `POST` | Private | Article edit interface for author or admin |
| `/my-blogs` | `GET` | Private | Personal dashboard showing articles authored by user |
| `/settings` | `GET`, `POST` | Private | Profile management and avatar selection |
| `/auth/login` | `GET`, `POST` | Public | User login page |
| `/auth/signup` | `GET`, `POST` | Public | User registration page |
| `/auth/logout` | `GET` | Public | Session logout handler |

## License

ISC
