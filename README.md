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

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

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
