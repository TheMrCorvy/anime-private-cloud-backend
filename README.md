# Anime Private Cloud Backend

A TypeScript-based Express.js backend for managing anime content in a private cloud environment.

## Features

- 🚀 Express.js with TypeScript
- 🛡️ Security middleware (Helmet)
- 🌐 CORS configuration
- 📝 Request logging (Morgan)
- 🔧 Environment variable configuration
- 📊 Health check endpoint
- 🎣 Git hooks with Husky (pre-commit & pre-push)
- 🔍 ESLint for code quality
- 💅 Prettier for code formatting

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

    ```bash
    npm install
    ```

3. Create environment file:

    ```bash
    cp .env.example .env
    ```

4. Start development server:
    ```bash
    npm run dev
    ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run clean` - Remove build directory
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix auto-fixable linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run api-key:generate` - Generate a new API key
- `npm run initialize-db` - Initialize database by scanning directories and syncing with Strapi

### API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/v1` - API version information

## Project Structure

```
src/
├── app.ts          # Main application class
├── server.ts       # Server entry point
└── ...             # Additional modules (to be added)
```

## Database Initialization

### Initialize Database Script

The `initialize-db` script (`npm run initialize-db`) is a comprehensive tool for scanning local anime directories and synchronizing them with a Strapi CMS backend. This script is essential for setting up and maintaining your anime private cloud database.

#### What it does:

1. **Directory Scanning**: Recursively scans your anime directory structure starting from `INITIAL_PATH`
2. **Content Classification**: Automatically detects and categorizes adult content (folders prefixed with "*")
3. **File Filtering**: Excludes specified file extensions and system files
4. **Database Writing**: Creates local JSON database files in the `./db` directory
5. **Strapi Integration**: Syncs with your Strapi CMS to upload new directories and episodes
6. **Relationship Management**: Maintains parent-child relationships between directories
7. **Error Handling**: Tracks failed operations and creates recovery files

#### Required Environment Variables:

```bash
# Strapi Configuration
STRAPI_API_HOST="https://your-strapi-instance.com"  # Strapi URL without /api
STRAPI_API_KEY="your-strapi-api-key"               # Your Strapi API Key

# Directory Scanning
INITIAL_PATH="/path/to/your/anime/collection"       # Absolute path to anime folder
EXCLUDED_PARENTS='["Temp", "Downloads"]'           # Folders to exclude as parents
EXCLUDED_EXTENSIONS='[".mkv", ".txt", ".nfo"]'     # File extensions to ignore
```

#### Usage:

1. **First-time setup**:
   ```bash
   # Configure your environment variables
   cp .env.example .env
   # Edit .env with your specific paths and Strapi configuration
   
   # Run the initialization
   npm run initialize-db
   ```

2. **Regular updates**: Run the script periodically to sync new anime additions:
   ```bash
   npm run initialize-db
   ```

#### Output Files:

The script creates several JSON files in the `./db` directory:
- `full_data.json` - Complete local directory structure
- `strapi_directories.json` - Current Strapi database state
- `pending_to_upload.json` - Directories not yet in Strapi
- `failed_directories.json` - Directories that failed to sync (if any)

#### Features:

- **Bulk Processing**: Uploads directories and episodes in configurable chunks (default: 50 items)
- **Adult Content Handling**: Automatically detects and properly categorizes adult content
- **Error Recovery**: Creates detailed logs of failed operations for manual review
- **Progress Tracking**: Provides detailed console output showing sync progress
- **Incremental Sync**: Only processes new directories, avoiding duplicate uploads

#### Common Issues:

- **Permission Errors**: Ensure the script has read access to your anime directories
- **Network Issues**: Check your Strapi connection and API key validity
- **Large Collections**: For very large collections, the script may take considerable time

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Basic Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

### Authentication
- `API_KEYS` - JSON array of valid API keys for authentication
- `STRAPI_API_KEY` - API key for Strapi CMS authentication

### Directory Scanning (for initialize-db)
- `INITIAL_PATH` - Absolute path to your anime collection root directory
- `EXCLUDED_PARENTS` - JSON array of folder names to exclude as parent directories
- `EXCLUDED_EXTENSIONS` - JSON array of file extensions to ignore during scanning

### External Services
- `STRAPI_API_HOST` - Base URL of your Strapi CMS instance (without /api)

### Feature Flags
- `FEATURE_FLAGS` - JSON array of feature flag configurations

## Git Hooks

This project uses Husky to manage Git hooks:

### Pre-commit Hook
- Runs ESLint on staged TypeScript/JavaScript files
- Checks Prettier formatting on staged files
- Automatically fixes linting issues where possible

### Pre-push Hook
- Builds the entire project to ensure it compiles successfully
- Prevents pushing if the build fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC
