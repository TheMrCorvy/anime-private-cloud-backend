# API Key System

This document explains how to use the API key system implemented in the application.

## Generate an API Key

To generate a new API key, run:

```bash
npm run api-key:generate
```

### Additional options

You can customize the generation with optional parameters:

```bash
# Generate with a custom prefix
npm run api-key:generate "myapp_"

# Generate with a custom prefix and length (in bytes)
npm run api-key:generate "myapp_" 64
```

### Example output

```
🔑 Generating API Key...

✅ API Key generated successfully!

📋 Details:
   Key:     apc_a28321a52711a6e72a9db36a629bba4f7e2320f266ec64f986ecf3318a8bce6f
   Hash:    19308fe3a76a23934a42434d341d77c0777c5e7d2482c4a35911290b974f101c
   Created: 2025-07-24T09:19:48.749Z

⚠️  IMPORTANT:
   - Save the key in a safe place
   - Use the hash for verification in the database
   - The key CANNOT be recovered once lost

💡 Example usage in your application:
   process.env.API_KEY = "apc_a28321a52711a6e72a9db36a629bba4f7e2320f266ec64f986ecf3318a8bce6f"
   // Hash to store in DB: "19308fe3a76a23934a42434d341d77c0777c5e7d2482c4a35911290b974f101c"
```

## Using API Keys

### 1. Basic configuration

```typescript
import express from 'express';
import { authenticateApiKey } from './middleware/apiKeyAuth';

const app = express();

const validApiKeys = ['apc_a28321a52711a6e72a9db36a629bba4f7e2320f266ec64f986ecf3318a8bce6f'];

app.use('/api/protected', authenticateApiKey(validApiKeys));

app.get('/api/protected/data', (req, res) => {
    res.json({ message: 'Protected data', apiKey: req.apiKey });
});
```

### 2. Configuration with database

```typescript
import { authenticateApiKeyWithHashes } from './middleware/apiKeyAuth';

const getValidHashes = async (): Promise<string[]> => {
    // Implement your database logic here
    return ['19308fe3a76a23934a42434d341d77c0777c5e7d2482c4a35911290b974f101c'];
};

app.use('/api/secure', authenticateApiKeyWithHashes(getValidHashes));
```

## Making requests with API Key

### Using the x-api-key header

```bash
curl -H "x-api-key: apc_your_api_key_here" http://localhost:3000/api/protected/data
```

### Using the Authorization header

```bash
curl -H "Authorization: Bearer apc_your_api_key_here" http://localhost:3000/api/protected/data
```

### With JavaScript/Fetch

```javascript
fetch('http://localhost:3000/api/protected/data', {
    headers: {
        'x-api-key': 'apc_your_api_key_here',
    },
})
    .then(response => response.json())
    .then(data => console.log(data));
```

## Security best practices

1. **Never hardcode API keys** in your source code
2. **Use environment variables** to store keys
3. **Store only hashes** in your database, never the full keys
4. **Implement rate limiting** to prevent brute force attacks
5. **Use HTTPS** in production to protect keys in transit
6. **Implement periodic key rotation**
7. **Log access attempts** for security monitoring

## File structure

```
src/
├── services/
│   └── apiKeyService.ts      # Functions to generate and verify API keys
├── middleware/
│   └── apiKeyAuth.ts         # Authentication middleware
scripts/
└── generateApiKey.ts         # CLI script to generate keys
docs/
└── API_KEYS.md               #
```
