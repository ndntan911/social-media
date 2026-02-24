# OAuth Setup Guide

This guide explains how to set up OAuth authentication for Google and Facebook in the Instagram Clone.

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add "Facebook Login" product
4. In the Facebook Login settings, add authorized redirect URI: `http://localhost:5000/api/auth/facebook/callback`
5. Copy the App ID and App Secret to your `.env` file

## Frontend Setup

The frontend is already configured to handle OAuth callbacks. The OAuth flow works as follows:

1. User clicks "Continue with Google/Facebook" button
2. Redirected to OAuth provider
3. After authentication, redirected to backend callback
4. Backend creates/updates user and redirects to frontend with token
5. Frontend handles the callback and authenticates the user

## OAuth Endpoints

### Google OAuth
- Initiate: `GET /api/auth/google`
- Callback: `GET /api/auth/google/callback`

### Facebook OAuth
- Initiate: `GET /api/auth/facebook`
- Callback: `GET /api/auth/facebook/callback`

## User Model Updates

The User model has been updated to support OAuth:

```javascript
googleId: {
  type: String,
  unique: true,
  sparse: true
},
facebookId: {
  type: String,
  unique: true,
  sparse: true
}
```

## OAuth Flow

1. **New User**: Creates a new account with OAuth provider data
2. **Existing User**: Links OAuth provider to existing account if email matches
3. **Password**: OAuth users don't need passwords but can set them later

## Security Features

- Session management with Passport.js
- JWT token generation after OAuth success
- Automatic account linking based on email
- Verified status for OAuth users

## Testing

1. Set up OAuth credentials as described above
2. Start the backend server: `npm run dev`
3. Start the frontend: `cd frontend && npm run dev`
4. Go to login/register page
5. Click "Continue with Google" or "Continue with Facebook"
6. Complete the OAuth flow
7. User should be authenticated and redirected to the feed

## Production Considerations

- Use HTTPS in production
- Update redirect URIs to production URLs
- Add proper domain verification in OAuth provider consoles
- Consider adding additional OAuth providers (GitHub, Twitter, etc.)
- Implement proper error handling for OAuth failures
