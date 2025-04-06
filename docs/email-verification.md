# Email Verification Process

This document outlines the email verification flow for UniNav, ensuring that users have valid email addresses and can receive important notifications.

## Overview

The email verification process is a critical security measure that:

- Confirms the authenticity of user email addresses
- Prevents account creation with fake emails
- Ensures users can receive important notifications and updates
- Helps maintain the integrity of the platform

## Verification Flow

### 1. User Registration

When a user registers:

- User account is created with `emailVerified` flag set to `false`
- A welcome email is sent to introduce the user to the platform
- A verification email is sent with a 6-digit code and a direct verification link

### 2. Verification Methods

Users can verify their email through two methods:

#### Method 1: Click on Verification Link (One-Click)

- User clicks the verification link in the email
- Link contains an encrypted JWT token with the verification code
- Server decrypts and validates the token
- If valid, user's email is marked as verified

#### Method 2: Enter Verification Code

- User enters the 6-digit code from the email on the verification page
- Server validates the code against the expected value
- If valid, user's email is marked as verified

### 3. Post-Verification

After successful verification:

- The `emailVerified` flag in the user's auth record is set to `true`
- A confirmation email is sent to the user
- User gains full access to the platform features

## Security Measures

The verification process includes several security measures:

1. **Time-Limited Tokens**: Verification links expire after 15 minutes
2. **Encrypted Tokens**: JWT tokens are encrypted for additional security
3. **Single-Use Codes**: Verification codes are valid for one use only
4. **Rate Limiting**: Multiple verification attempts are rate-limited

## Resending Verification Emails

If users don't receive the verification email or the verification period expires:

- They can request a new verification email from the login page or account settings
- The system generates a new verification code and token
- Previous verification tokens are invalidated

## Technical Implementation

3. **Time-Limited Backup**: JWT tokens for backup verification expire after 15 minutes
4. **Encrypted Tokens**: JWT tokens are encrypted for additional security

## Resending Verification Emails

If users don't receive the verification email or the verification period expires:

- They can request a new verification email from the login page or account settings
- The system generates a new verification code and stores it in the database
- Previous verification codes are invalidated
- A new email is sent with the updated code

## Technical Implementation

### Code Generation and Storage

```typescript
// Generate a 6-digit verification code
const verificationCode = await generateVerificationCode();

// Save verification code in the database
await authRepository.saveVerificationCode(userId, verificationCode);
```

### Verification Process

```typescript
// Verify the code against the database
const isVerified = await authRepository.verifyCode(email, code);

if (isVerified) {
  // Code matched, email is now verified
  // Code is automatically cleared from the database
}
```

## API Endpoints

| Endpoint                    | Method | Description               | Request Body         | Response               |
| --------------------------- | ------ | ------------------------- | -------------------- | ---------------------- |
| `/auth/verify-email`        | POST   | Verify email using code   | `{ email, code }`    | Success/failure status |
| `/auth/verify-email/token`  | GET    | Verify email using token  | Query param: `token` | Success/failure status |
| `/auth/resend-verification` | POST   | Resend verification email | `{ email }`          | Success/failure status |
