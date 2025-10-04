# 🚀 Vercel Deployment Guide

## Problem: Admin Panel Functions Not Working

Your admin panel functions (add products, flash sales, live chat) are not working because the frontend can't connect to the backend API.

## 🔧 Solution Steps

### 1. **Deploy Backend to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your backend repository
4. Set the following **Environment Variables** in Vercel:

```env
MONGODB_URI=mongodb+srv://kiboxsonleena:20040620Kiyu@cluster0.cr1byep.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

5. Deploy the backend
6. Note the backend URL (e.g., `https://your-backend-abc123.vercel.app`)

### 2. **Configure Frontend Environment Variables**

1. In your **Frontend** Vercel project settings
2. Add this Environment Variable:

```env
REACT_APP_API_URL=https://your-backend-abc123.vercel.app
```

3. Redeploy your frontend

### 3. **Test the Connection**

1. Go to your deployed frontend
2. Access Admin Panel
3. Click the new **"🔧 API Test"** tab
4. This will show you:
   - Current API URL being used
   - Connection status to all endpoints
   - Detailed error messages if any

## 🔍 Troubleshooting

### If API Test shows "localhost":
- You forgot to set `REACT_APP_API_URL` in frontend Vercel environment variables

### If API Test shows connection errors:
- Backend is not deployed or not running
- Check backend Vercel function logs

### If API Test shows CORS errors:
- Update `ALLOWED_ORIGINS` in backend environment variables to include your frontend domain

### If API Test shows 404 errors:
- Backend endpoints are not deployed correctly
- Check backend deployment logs

## 📋 Quick Checklist

- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set (MONGODB_URI, ALLOWED_ORIGINS, etc.)
- [ ] Frontend environment variable set (REACT_APP_API_URL)
- [ ] Frontend redeployed after setting environment variable
- [ ] API Test tab shows all green checkmarks

## 🆘 Still Not Working?

1. Check Vercel function logs for both frontend and backend
2. Use browser developer tools to see network requests
3. Verify all environment variables are set correctly
4. Make sure both deployments are using the latest code

## 📞 Common URLs Structure

- Frontend: `https://your-project-frontend.vercel.app`
- Backend: `https://your-project-backend.vercel.app`
- API Test: `https://your-project-backend.vercel.app/api/test`

Replace `your-project-frontend` and `your-project-backend` with your actual Vercel project names.
