# Volunteer Hub — REST API Specification & Contract

This document provides complete documentation for the Volunteer Hub REST API. Frontend developers can use this contract to mock responses, develop UI components, and integrate with the backend running at `/api`.

**Base URL:**
- Production: `https://volunteer-hub.duckdns.org/api`
- Development: `http://localhost:8000/api`
- Swagger UI (interactive docs): `http://localhost:8000/docs`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

---

## 1. Authentication & Security

All protected endpoints require a JWT Bearer token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

### User Roles
- `volunteer`: Regular citizen / volunteer fundraiser creator.
- `military`: Servicemen / military unit representatives who post logistical equipment needs.
- `admin`: Platform administrator with verification and moderation capabilities.

---

## 2. Authentication Endpoints

### 2.1 Register User
`POST /api/auth/register`

Register a new account (Volunteer or Military Unit).

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Taras Shevchenko",
  "role": "volunteer", 
  "unit_name": null
}
```
*Note: `role` must be one of `volunteer`, `military`, `admin`. `unit_name` is optional (typically provided when `role == "military"`).*

#### Response `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Taras Shevchenko",
  "role": "volunteer",
  "unit_name": null,
  "is_verified": false,
  "points": 0,
  "created_at": "2026-11-18T06:00:00Z"
}
```

---

### 2.2 Login User
`POST /api/auth/login`

Authenticate user and obtain a JWT Bearer access token. Accepts either JSON payload or OAuth2 `application/x-www-form-urlencoded` credentials.

#### Request Body (JSON)
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Taras Shevchenko",
    "role": "volunteer",
    "unit_name": null,
    "is_verified": false,
    "points": 0,
    "created_at": "2026-11-18T06:00:00Z"
  }
}
```

---

### 2.3 Sign in with Google
`POST /api/auth/google`

Authenticate or register a user using a Google Identity Services ID Token (`credential` provided by `@react-oauth/google`).

**Google OAuth Client ID:**
`921149802430-77d460raj6hhtomlqq7sosfvcgsergtt.apps.googleusercontent.com`

#### Request Body (JSON)
```json
{
  "id_token": "<google_id_token_jwt>",
  "role": "volunteer"
}
```
*Note: `role` is optional (`volunteer` | `military`, defaults to `"volunteer"`). If the user does not exist in the database yet, an account is automatically provisioned with this role and `is_verified=false`.*

#### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 7,
    "email": "andrii@gmail.com",
    "full_name": "Andrii Dv",
    "role": "volunteer",
    "unit_name": null,
    "is_verified": false,
    "points": 0,
    "created_at": "2026-11-18T07:15:00Z"
  }
}
```

---

### 2.4 Current User Profile
`GET /api/auth/me`

Retrieve profile of currently authenticated user.

#### Headers
```http
Authorization: Bearer <token>
```

#### Response `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Taras Shevchenko",
  "role": "volunteer",
  "unit_name": null,
  "is_verified": false,
  "points": 150,
  "created_at": "2026-11-18T06:00:00Z"
}
```

---

## 3. Needs Endpoints

### 3.1 List Needs
`GET /api/needs`

List military needs with optional filtering and aggregated `raised_amount` (sum of funds gathered by linked friendly jars).

#### Query Parameters
- `category` *(optional)*: `drones` | `ew` | `vehicles` | `medicine` | `gear`
- `urgency` *(optional)*: `low` | `medium` | `critical`
- `status` *(optional)*: `open` | `completed`

#### Response `200 OK`
```json
[
  {
    "id": 1,
    "military_user_id": 2,
    "military_user": {
      "id": 2,
      "full_name": "47th Separate Mechanized Brigade",
      "unit_name": "Magura 47th OMBr",
      "is_verified": true
    },
    "title": "10 FPV Kamikaze Strike Drones with Thermal Optics",
    "description": "Urgent procurement of strike drones for night-time target interdiction on Pokrovsk direction.",
    "category": "drones",
    "target_amount": 180000.0,
    "raised_amount": 125000.0,
    "urgency": "critical",
    "status": "open",
    "fundraisers_count": 3,
    "created_at": "2026-11-18T05:30:00Z"
  }
]
```

---

### 3.2 Get Need Details
`GET /api/needs/{id}`

Retrieve full detailed view of a specific need, including its creator details and list of linked friendly jars.

#### Response `200 OK`
```json
{
  "id": 1,
  "military_user_id": 2,
  "military_user": {
    "id": 2,
    "email": "magura47@military.ua",
    "full_name": "47th Separate Mechanized Brigade",
    "unit_name": "Magura 47th OMBr",
    "is_verified": true
  },
  "title": "10 FPV Kamikaze Strike Drones with Thermal Optics",
  "description": "Urgent procurement of strike drones for night-time target interdiction on Pokrovsk direction.",
  "category": "drones",
  "target_amount": 180000.0,
  "raised_amount": 125000.0,
  "urgency": "critical",
  "status": "open",
  "created_at": "2026-11-18T05:30:00Z",
  "fundraisers": [
    {
      "id": 1,
      "need_id": 1,
      "volunteer_user_id": 3,
      "volunteer": {
        "id": 3,
        "full_name": "Serhiy Prytula Fan Club",
        "email": "serhiy@volunteers.ua"
      },
      "jar_url": "https://send.monobank.ua/jar/3mDemoJar47th",
      "goal_amount": 50000.0,
      "current_amount": 50000.0,
      "status": "verified",
      "proof_image_url": "https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/receipt_fpv_1.jpg",
      "created_at": "2026-11-18T06:10:00Z"
    },
    {
      "id": 2,
      "need_id": 1,
      "volunteer_user_id": 4,
      "volunteer": {
        "id": 4,
        "full_name": "Oksana Ivanenko",
        "email": "oksana@volunteers.ua"
      },
      "jar_url": "https://send.monobank.ua/jar/9xDemoJarDrones",
      "goal_amount": 75000.0,
      "current_amount": 75000.0,
      "status": "active",
      "proof_image_url": null,
      "created_at": "2026-11-18T06:15:00Z"
    }
  ]
}
```

---

### 3.3 Create Military Need
`POST /api/needs`

**Authorization:** Requires authenticated user with role `military`.

#### Request Body
```json
{
  "title": "Mobile EW Counter-FPV Jammer Dome",
  "description": "Vehicle-mounted multi-band electronic warfare jammer to protect frontline evacuation team.",
  "category": "ew",
  "target_amount": 220000.0,
  "urgency": "critical"
}
```

#### Response `201 Created`
```json
{
  "id": 2,
  "military_user_id": 2,
  "title": "Mobile EW Counter-FPV Jammer Dome",
  "description": "Vehicle-mounted multi-band electronic warfare jammer to protect frontline evacuation team.",
  "category": "ew",
  "target_amount": 220000.0,
  "raised_amount": 0.0,
  "urgency": "critical",
  "status": "open",
  "created_at": "2026-11-18T06:45:00Z"
}
```

---

## 4. Fundraiser ("Friendly Jars" / Дружні банки) Endpoints

### 4.1 Claim a Slot / Open Friendly Jar
`POST /api/needs/{need_id}/fundraisers`

**Authorization:** Requires authenticated user with role `volunteer`.

#### Request Body
```json
{
  "jar_url": "https://send.monobank.ua/jar/7kFriendJarSample",
  "goal_amount": 35000.0,
  "current_amount": 0.0
}
```

#### Response `201 Created`
```json
{
  "id": 5,
  "need_id": 2,
  "volunteer_user_id": 3,
  "jar_url": "https://send.monobank.ua/jar/7kFriendJarSample",
  "goal_amount": 35000.0,
  "current_amount": 0.0,
  "status": "active",
  "proof_image_url": null,
  "created_at": "2026-11-18T07:00:00Z"
}
```

---

### 4.2 Update Fundraiser (Progress or Link)
`PATCH /api/fundraisers/{id}`

**Authorization:** Must be the volunteer owner of the fundraiser or an admin.

#### Request Body
```json
{
  "current_amount": 35000.0,
  "jar_url": "https://send.monobank.ua/jar/7kFriendJarSampleUpdated"
}
```
*(All fields optional)*

#### Response `200 OK`
```json
{
  "id": 5,
  "need_id": 2,
  "volunteer_user_id": 3,
  "jar_url": "https://send.monobank.ua/jar/7kFriendJarSampleUpdated",
  "goal_amount": 35000.0,
  "current_amount": 35000.0,
  "status": "active",
  "proof_image_url": null,
  "created_at": "2026-11-18T07:00:00Z"
}
```

---

### 4.3 Upload Proof Receipt Image
`POST /api/fundraisers/{id}/proof`

Uploads receipt / transfer confirmation screenshot directly to Amazon S3 bucket (`proofs/*`), stores public URL in `proof_image_url`, and transitions status to `pending_verification`.

**Authorization:** Must be the volunteer owner of the fundraiser.  
**Content-Type:** `multipart/form-data`

#### Form Fields
- `file`: Image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`)

#### Response `200 OK`
```json
{
  "id": 5,
  "need_id": 2,
  "volunteer_user_id": 3,
  "jar_url": "https://send.monobank.ua/jar/7kFriendJarSampleUpdated",
  "goal_amount": 35000.0,
  "current_amount": 35000.0,
  "status": "pending_verification",
  "proof_image_url": "https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/5_receipt_1700000000.jpg",
  "created_at": "2026-11-18T07:00:00Z"
}
```

---

### 4.4 Verify Fundraiser Receipt
`POST /api/fundraisers/{id}/verify`

Confirm receipt of funds / delivery of goods for this jar.
- Sets fundraiser `status` to `verified`.
- Awards volunteer points (e.g. 1 point per 1,000 UAH verified, min 10 points).
- Recalculates total verified amount for the parent `Need`; if total verified >= `target_amount`, automatically sets `Need.status = 'completed'`.

**Authorization:** Must be the military owner of the linked need or an admin.

#### Response `200 OK`
```json
{
  "message": "Fundraiser verified successfully.",
  "fundraiser": {
    "id": 5,
    "need_id": 2,
    "volunteer_user_id": 3,
    "current_amount": 35000.0,
    "status": "verified",
    "proof_image_url": "https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/5_receipt_1700000000.jpg"
  },
  "awarded_points": 35,
  "need_status": "open",
  "total_verified_amount": 35000.0,
  "target_amount": 220000.0
}
```

---

## 5. Leaderboard Endpoints

### 5.1 Get Leaderboard
`GET /api/leaderboard`

Returns top volunteers ranked by total verified raised funds and gamification points.

#### Response `200 OK`
```json
[
  {
    "rank": 1,
    "volunteer_id": 3,
    "full_name": "Serhiy Prytula Fan Club",
    "points": 500,
    "total_verified_raised": 500000.0,
    "verified_jars_count": 5
  },
  {
    "rank": 2,
    "volunteer_id": 4,
    "full_name": "Oksana Ivanenko",
    "points": 180,
    "total_verified_raised": 180000.0,
    "verified_jars_count": 2
  }
]
```

---

## 6. Admin Endpoints

### 6.1 Verify Military Account
`POST /api/admin/users/{id}/verify`

Verify the identity and official military status of a user account.

**Authorization:** Requires authenticated user with role `admin`.

#### Response `200 OK`
```json
{
  "id": 2,
  "email": "magura47@military.ua",
  "full_name": "47th Separate Mechanized Brigade",
  "unit_name": "Magura 47th OMBr",
  "role": "military",
  "is_verified": true,
  "points": 0,
  "created_at": "2026-11-18T05:00:00Z"
}
```

---

## 7. Error Handling Standard

All error responses return standard JSON format:
```json
{
  "detail": "Error description message"
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation error or illegal state transition.
- `401 Unauthorized`: Missing or invalid Bearer token.
- `403 Forbidden`: User does not have the required role or permissions.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Server-side error.
