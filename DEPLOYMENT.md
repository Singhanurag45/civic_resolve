# 🚀 Deployment Guide

This guide will help you deploy the **Civic Issue Reporter** application:

- **Backend** → Render
- **Frontend** → Vercel

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **MongoDB Atlas** - Free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
5. **Cloudinary Account** - Free account at [cloudinary.com](https://cloudinary.com)

---

## 🔧 Part 1: Backend Deployment on Render

### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user (username & password)
4. Whitelist IP addresses:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string (replace `<password>` with your password)
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civic-issue-reporter?retryWrites=true&w=majority`

### Step 2: Prepare Cloudinary

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → Copy these values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Deploy Backend on Render

1. **Login to Render**

   - Go to [render.com](https://render.com) and sign in

2. **Create New Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Singhanurag45/civic_resolve`

3. **Configure Service Settings**

   - **Name**: `civic-issue-reporter-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine

4. **Add Environment Variables**
   Click "Environment" tab and add:

   ```
   DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/civic-issue-reporter?retryWrites=true&w=majority
   JWT_PASSWORD=your-super-secret-jwt-key-here-min-32-chars
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   PORT=10000
   NODE_ENV=production
   ```

5. **Deploy**

   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete (5-10 minutes)
   - Copy your backend URL (e.g., `https://civic-issue-reporter-backend.onrender.com`)

6. **Important Notes for Render**
   - Free tier services **spin down after 15 minutes of inactivity**
   - First request after spin-down may take 30-60 seconds
   - Consider upgrading to paid tier for always-on service

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Environment Variables

You'll need:

- **Backend API URL** (from Render deployment)
- **Gemini API Key** (optional, for chatbot feature)

### Step 2: Deploy Frontend on Vercel

1. **Login to Vercel**

   - Go to [vercel.com](https://vercel.com) and sign in
   - Connect your GitHub account if not already connected

2. **Import Project**

   - Click "Add New..." → "Project"
   - Select your repository: `Singhanurag45/civic_resolve`
   - Click "Import"

3. **Configure Project Settings**

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   VITE_API_BASE_URL=https://civic-issue-reporter-backend.onrender.com
   VITE_GEMINI_API_KEY=your-gemini-api-key (optional)
   ```

   ⚠️ **Important**: Replace `https://civic-issue-reporter-backend.onrender.com` with your actual Render backend URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Wait for deployment (2-5 minutes)
   - You'll get a URL like: `https://civic-issue-reporter.vercel.app`

---

## ✅ Post-Deployment Checklist

### Backend (Render)

- [ ] Backend URL is accessible (should show "Civic Issue Reporter Backend is Running")
- [ ] Test API endpoint: `https://your-backend.onrender.com/api/v1/departments`
- [ ] Check Render logs for any errors
- [ ] Verify MongoDB connection in logs

### Frontend (Vercel)

- [ ] Frontend URL loads correctly
- [ ] Test signup/login functionality
- [ ] Verify API calls are going to correct backend URL
- [ ] Check browser console for errors
- [ ] Test issue reporting with image upload

### Integration Testing

- [ ] Sign up as a citizen
- [ ] Sign up as an admin
- [ ] Report an issue with image
- [ ] View issues on admin dashboard
- [ ] Update issue status
- [ ] Test all CRUD operations

---

## 🔄 Updating Deployments

### Update Backend (Render)

1. Push changes to GitHub
2. Render automatically detects changes and redeploys
3. Or manually trigger: Render Dashboard → Your Service → "Manual Deploy"

### Update Frontend (Vercel)

1. Push changes to GitHub
2. Vercel automatically detects changes and redeploys
3. Or manually trigger: Vercel Dashboard → Your Project → "Redeploy"

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend returns 503 or timeout

- **Solution**: Free tier services spin down. Wait 30-60 seconds for first request

**Problem**: MongoDB connection failed

- **Solution**:
  - Check MongoDB Atlas IP whitelist includes Render IPs
  - Verify DATABASE_URL is correct
  - Check MongoDB user credentials

**Problem**: Cloudinary upload fails

- **Solution**: Verify all Cloudinary environment variables are set correctly

### Frontend Issues

**Problem**: API calls fail with CORS error

- **Solution**:
  - Check backend CORS configuration allows your Vercel domain
  - Update `backend/src/app.ts` to include Vercel URL in CORS origins

**Problem**: Environment variables not working

- **Solution**:
  - Vite requires `VITE_` prefix for client-side variables
  - Redeploy after adding environment variables
  - Clear browser cache

**Problem**: Build fails

- **Solution**:
  - Check Vercel build logs
  - Ensure all dependencies are in `package.json`
  - Verify Node.js version compatibility

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets** - At least 32 characters, random
3. **Rotate secrets regularly** - Especially if exposed
4. **Use MongoDB Atlas IP restrictions** - Limit to Render IPs if possible
5. **Enable HTTPS** - Both Render and Vercel provide this automatically
6. **Review CORS settings** - Only allow your frontend domain

---

## 📝 Environment Variables Summary

### Backend (Render)

```
DATABASE_URL          - MongoDB connection string
JWT_PASSWORD          - Secret key for JWT tokens
CLOUDINARY_CLOUD_NAME - Cloudinary cloud name
CLOUDINARY_API_KEY    - Cloudinary API key
CLOUDINARY_API_SECRET  - Cloudinary API secret
PORT                  - Server port (usually 10000 for Render)
NODE_ENV              - Set to "production"
```

### Frontend (Vercel)

```
VITE_API_BASE_URL     - Your Render backend URL
VITE_GEMINI_API_KEY   - Optional, for chatbot feature
```

---

## 🎉 You're Done!

Your application should now be live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

Share your frontend URL with users to start using the application!

---

## 📞 Need Help?

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
