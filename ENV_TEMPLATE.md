# Environment Variables Template

Use this as a reference when setting up your deployment.

## Backend Environment Variables (Render)

```env
# MongoDB Connection
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civic-issue-reporter?retryWrites=true&w=majority

# JWT Secret (use a strong random string, minimum 32 characters)
JWT_PASSWORD=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here

# Server Configuration
PORT=10000
NODE_ENV=production
```

## Frontend Environment Variables (Vercel)

```env
# Backend API URL (replace with your Render backend URL)
VITE_API_BASE_URL=https://civic-issue-reporter-backend.onrender.com

# Optional: Gemini API Key for chatbot feature
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## How to Get Values

### MongoDB Atlas Connection String

1. Go to MongoDB Atlas Dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `civic-issue-reporter` (or your preferred database name)

### Cloudinary Credentials

1. Go to Cloudinary Dashboard
2. Copy values from "Account Details" section:
   - Cloud Name
   - API Key
   - API Secret

### JWT Password

Generate a strong random string:

- Use an online generator: https://randomkeygen.com/
- Or use Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Minimum 32 characters recommended

### Render Backend URL

After deploying on Render, you'll get a URL like:

- `https://your-service-name.onrender.com`
- Use this as your `VITE_API_BASE_URL` in Vercel

---

## ⚠️ Security Notes

1. **Never commit these values to Git**
2. **Use different JWT secrets for development and production**
3. **Rotate secrets if they're ever exposed**
4. **Keep MongoDB credentials secure**
