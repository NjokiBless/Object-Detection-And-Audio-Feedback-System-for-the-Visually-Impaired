# Object Detector + Navigation Assistant

A real-time object detection and navigation assistant built for mobile. The app uses deep-learning object detection to identify nearby objects through the phone camera and provides voice guidance and map-based navigation to a user’s chosen destination. The system has a FastAPI backend, a React Native (Expo) mobile client, and integrates Google Maps for turn-by-turn voice navigation.

---

## Project Overview

This system supports two major functions:

1. **Real-time Object Detection**

   * Detects everyday objects from the live camera feed.
   * Displays labeled bounding boxes on screen.
   * Speaks detections aloud through a built-in voice assistant.

2. **Map-Based Voice Navigation**

   * Lets users search and select where they want to go on a Google Map.
   * Auto-fills current location when permission is granted.
   * Provides continuous voice guidance even when the user switches screens (background audio).

**Models & Techniques**

* YOLO-based object detector (backend inference).
* Optional depth estimation support (backend) for richer context.
* Mobile client streams frames or periodically snapshots for inference.
* Google Maps SDK + Directions API for routing and voice guidance.

---

## Requirements

### Backend

* **Python 3.10+**
* FastAPI, Uvicorn
* Torch / Ultralytics YOLO
* Pillow, OpenCV
* (Optional) Redis for caching

### Mobile

* **Node.js 18+**
* Expo SDK 54
* React Native 0.81+
* expo-camera, expo-speech, expo-location
* @react-navigation/native, native-stack
* react-native-maps (Google provider)

**Recommended hardware**

* 8GB+ RAM for backend inference
* GPU optional but improves speed

---

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd object-detector
```

---

## Backend Setup (FastAPI)

### 2. Create and activate virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure environment variables

Create `backend/.env`:

```env
JWT_SECRET=your_jwt_secret
MODEL_PATH=./models/yolo.pt
ALLOWED_ORIGINS=*
```

### 5. Run the backend server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at:

```
http://127.0.0.1:8000
```

### 6. Test backend detection

```bash
curl -X POST http://127.0.0.1:8000/detect/image \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

---

## Mobile Setup (React Native + Expo)

### 7. Install dependencies

```bash
cd ../mobile
npm install
```

### 8. Configure environment variables

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
```

To find your local IP:

```bash
hostname -I | awk '{print $1}'
```

### 9. Start the Expo app

```bash
npm run start
```

* Scan the QR code with **Expo Go** (Android/iOS).
* Ensure your phone and laptop are on the same network.

---

## Using the App

### Object Detection

1. Log in.
2. Open the **Camera** screen.
3. The app will:

   * request camera permission
   * start detecting objects automatically
4. Detected objects appear with bounding boxes and labels.
5. The voice assistant reads detections aloud.

### Navigation

1. Go to the **Navigation** screen.
2. Search where you want to go.
3. Confirm destination.
4. Start voice guidance.
5. Guidance continues even if you switch pages.

---

## API Endpoints

### Auth

* `POST /auth/register`
* `POST /auth/verify`
* `POST /auth/login`

### Detection

* `POST /detect/image`
  Upload a single image and return detection boxes.

* `POST /detect/frame`
  Accepts a camera frame and returns real-time detections.

### Navigation (Mobile uses Google APIs directly)

* Google Places Autocomplete
* Google Directions
* Google Maps SDK

---

## Project Structure

```
object-detector/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── auth.py              # Authentication routes
│   │   ├── detect.py            # Detection routes
│   │   ├── models.py            # DB models
│   │   ├── utils.py             # JWT + helpers
│   │   └── services/
│   │       └── detector.py      # YOLO inference logic
│   ├── models/                  # Trained YOLO weights
│   ├── requirements.txt
│   └── .env
│
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts        # fetch wrapper
│   │   │   └── detect.ts        # detection API calls
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── CameraScreen.tsx # realtime detection feed
│   │   │   └── NavigationScreen.tsx # google maps nav
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── theme/
│   ├── App.tsx
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Model Artifacts

Model weight files are **not committed to GitHub** due to size.
To run detection you must:

1. Download weights into:

   ```
   backend/models/yolo.pt
   ```
2. Ensure `MODEL_PATH` in `backend/.env` matches the file location.

---

## Google Maps Setup

To enable navigation:

1. Create a Google Cloud project.
2. Enable:

   * **Maps SDK for Android**
   * **Maps SDK for iOS**
   * **Places API**
   * **Directions API**
3. Generate an API key.
4. Add it in:

   ```
   mobile/.env
   EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
   ```
5. For iOS, ensure your Expo config has:

   * location permissions
   * Google Maps key set in `app.json/app.config.js`

---

## Troubleshooting

**Mobile says “Network request timed out”?**

* Make sure backend is running with:

  ```bash
  --host 0.0.0.0
  ```
* Confirm your phone uses the same Wi-Fi as your laptop.
* Confirm `EXPO_PUBLIC_API_URL` matches your laptop IP.

**Camera not ready / cannot capture?**

* Wait for the `onCameraReady` event before starting the detect loop.
* Avoid calling detection too early on mount.

**No detections appearing?**

* Test backend separately with curl.
* Confirm model weights exist in `backend/models/`.
* Check backend logs for inference errors.

**Google Maps not showing?**

* Confirm Maps SDK enabled in Google Cloud console.
* Ensure API key restrictions allow your package/bundle ID.
* Restart Expo after editing `.env`.

---

## Contributing

Contributions are welcome.
Please open a pull request or issue with:

* bug reports
* feature improvements
* UI/UX upgrades
* model accuracy enhancements

---

## For Reviewers

To evaluate quickly without retraining:

1. Clone repo
2. Place YOLO weights in `backend/models/`
3. Run backend
4. Run mobile app
5. Test:

   * realtime detection
   * navigation search + voice guidance

---

If you want, I can also generate a **shorter “RUN_INSTRUCTIONS.md”** version of this for quick demo/testing.
