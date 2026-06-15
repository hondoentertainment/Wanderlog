# Firestore Security Rules Deployment

## Quick Steps

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/wanderlog-55e55/firestore/rules

2. **Copy these rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"**

## What these rules do:
- Users can only read/write their own data (`/users/{their-uid}`)
- All other collections are denied by default
- Requires authentication for all access
