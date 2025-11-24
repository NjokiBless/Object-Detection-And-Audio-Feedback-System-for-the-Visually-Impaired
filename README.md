# Object Detector + Navigation Assistant

A real-time object detection and navigation assistant built for mobile. The app uses a deep-learning object detection model served via a FastAPI backend, while the React Native (Expo) client streams camera frames, displays detections, and supports Google Maps voice navigation to a selected destination.

## Project Overview

This system helps users:

* Detect objects in real time using their phone camera
* Receive spoken feedback describing detected objects
* Navigate to a chosen destination using Google Maps with continuous voice guidance
* Access safety, accessibility, and profile tools inside the app

**Core Features**

* **Real-time Object Detection:** Live camera feed with bounding box overlays and labels.
* **Voice Guidance:** Spoken feedback for detections and navigation prompts.
* **Google Maps Navigation:** Search a destination, optionally auto-fill current location, and receive continuous voice direction even when switching screens.
* **User Authentication:** Register, log in, token-based sessions.
* **User Dashboard:** History, detections summary, preferences.
* **Accessibility Tools:** High-contrast UI, large fonts, screen-reader friendly layouts.

**Main Screens**

* HomeScreen
* RegisterScreen
* LoginScreen
* DashboardScreen
* AdminDashboardScreen
* CameraScreen
* MapNavigationScreen
* AboutScreen
* AccessibilityScreen
* ProfileScreen
* SafetyScreen

## Requirements

### Backend

* **Python 3.10+**
* pip, setuptools, wheel
* GPU optional but recommended for faster inference

### Mobile

* **Node.js 18+**
* Expo SDK 54
* Android Studio emulator or a physical phone
* Google Maps API key (Directions + Places enabled)

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd object-detector
```

---

## Backend Setup (FastAPI)

### 2. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 4. Add environment variables

Create `backend/.env`:

```env
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_secret>
MODEL_PATH=models/yolo.pt
```

### 5. Run the backend API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API will run at:

```
http://127.0.0.1:8000
```

---

## Mobile Setup (React Native Expo)

### 6. Install mobile dependencies

```bash
cd ../mobile
npm install
```

### 7. Add environment variables

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000
EXPO_PUBLIC_GOOGLE_MAPS_KEY=<your_google_maps_key>
```

Replace `<YOUR_LOCAL_IP>` with your computer’s LAN IP (e.g., `192.168.x.x`), so your phone can reach the backend.

### 8. Start the Expo app

```bash
npm run start
```

* Press `i` for iOS simulator
* Press `a` for Android emulator
* Or scan the QR code using Expo Go on your phone.

---

## Running Real-Time Detection

1. Log in
2. Open **CameraScreen**
3. The app continuously:

   * captures frames
   * sends them to `/detect/image`
   * renders bounding boxes
   * speaks detected object names

---

## Google Maps Navigation Flow

1. Open **MapNavigationScreen**
2. Tap destination input
3. Search where you want to go
4. If location permission is granted, your start location auto-fills
5. Tap **Start Navigation**
6. The app keeps voice guidance running even when you switch screens.

---

## API Endpoints

### Auth

* `POST /auth/register`
* `POST /auth/verify`
* `POST /auth/login`
* `POST /auth/logout`
* `GET /auth/me`

### Detection

* `POST /detect/image`
  Accepts image upload and returns detected objects.

### Dashboard / Admin

* `GET /dashboard/detections`
* `GET /dashboard/reports/summary`
* `GET /admin/users`
* `GET /admin/detections`

---

## Project Structure

```
object-detector/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── auth.py                 # Auth routes
│   │   ├── detect.py               # Detection routes
│   │   ├── models.py               # DB models
│   │   ├── utils.py                # Helpers (JWT, hashing, etc.)
│   │   └── services/
│   │       └── yolo_service.py     # Model inference service
│   ├── models/                     # Trained YOLO model weights (git-ignored)
│   ├── requirements.txt
│   └── .env
│
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts           # Fetch wrapper
│   │   │   ├── auth.ts             # Auth calls
│   │   │   └── detect.ts           # Detect calls
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Auth state provider
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx   # App navigation
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── AdminDashboardScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── MapNavigationScreen.tsx
│   │   │   ├── AboutScreen.tsx
│   │   │   ├── AccessibilityScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── SafetyScreen.tsx
│   │   └── theme/
│   │       └── index.ts            # Theme + colors
│   ├── app.json
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Model Artifacts

Model weights are not stored in Git due to size.
To use detections:

1. Place trained weights inside:

   ```
   backend/models/yolo.pt
   ```
2. Ensure `MODEL_PATH=models/yolo.pt` is set in `.env`

---

## Hardware Requirements

* Minimum: 8GB RAM, CPU inference supported
* Recommended: GPU machine for training/retraining
* Mobile: Any modern Android/iOS device with camera

---

## Troubleshooting

**Backend not reachable from phone**

* Ensure backend started with:

  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
* Confirm `EXPO_PUBLIC_API_URL` uses your LAN IP.

**Network request timed out**

* Phone and laptop must be on the same Wi-Fi.
* Check firewall rules for port `8000`.

**Camera not ready yet**

* Wait for `onCameraReady` callback before capturing frames.

**No detections showing**

* Confirm the backend endpoint works:

  ```bash
  curl -X POST http://127.0.0.1:8000/detect/image
  ```
* Confirm model path is correct and weights exist.

**Google Maps not loading**

* Ensure your Google Maps key is valid and enabled for:

  * Places API
  * Directions API
  * Maps SDK

---

## Contributing

Contributions are welcome. Please:

1. Fork the repo
2. Create a feature branch
3. Submit a pull request with clear changelog notes

---

## For Reviewers

To run the project without retraining:

1. Clone repo
2. Install backend + mobile dependencies
3. Add `.env` files
4. Place model weights in `backend/models/`
5. Run backend then mobile app


