# Object Detector & Navigation Assistant (Bloculis)

A real-time object detection and navigation assistant for visually impaired users. The system uses deep learning (YOLOv8 + depth estimation) to detect objects from the phone camera, estimate distance, and give spoken guidance. It also includes Google Maps voice navigation so a user can search a destination, start turn-by-turn guidance, and keep hearing directions even when navigating to other screens.

---

## Project Overview

This app helps users safely move around by:

* Detecting objects in real time using the mobile camera
* Estimating how far objects are from the user
* Announcing detected objects and distances through voice feedback
* Providing Google Maps based navigation with voice guidance that continues in the background

**Key detection classes (example):**

* Person
* Vehicles (car, bus, bike)
* Obstacles (chair, table, wall, stairs)
* Common outdoor objects (pole, tree, dog, etc.)

**Models:**

* YOLOv8 Object Detection
* MiDaS Depth Estimation (distance awareness)

**Platforms:**

* Mobile: React Native (Expo SDK 54)
* Backend: FastAPI (Python)
* Database: MongoDB Atlas

---

## Features

### ✅ Real-Time Object Detection

* Live detection from camera preview
* Bounding boxes + labels
* Confidence filtering

### ✅ Distance Estimation

* Depth estimation from MiDaS
* Spoken distance warnings (e.g., “Person 1.8 meters ahead”)

### ✅ Voice Assistant

* Text-to-Speech feedback
* Auto-repeat when new objects appear
* Continues speaking while user uses other features

### ✅ Google Maps Navigation

* Destination search (Places Autocomplete)
* Start voice navigation from current location
* Turn-by-turn spoken directions
* Background voice continues even if user changes screens

### ✅ User System

* Register / Login
* Token-based routes
* Detection history saved to DB

---

## Requirements

### Backend

* **Python 3.10+**
* pip, setuptools, wheel
* Recommended: 8GB+ RAM for model inference

### Mobile

* **Node.js 18+**
* Expo CLI
* Android Emulator or physical device
* Expo SDK 54

---

## Local Setup

## 1. Clone repository

```bash
git clone https://github.com/<your-username>/object-detector.git
cd object-detector
```

---

# Backend Setup (FastAPI)

## 2. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

## 3. Install dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## 4. Create `.env`

Create a file called `backend/.env`:

```env
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-secret>
MODEL_PATH=models/yolov8.pt
DEPTH_MODEL_PATH=models/midas.pt
```

## 5. Run backend server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

# Mobile Setup (Expo React Native)

## 6. Install dependencies

```bash
cd ../mobile
npm install
```

## 7. Create `.env`

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_PC_IP>:8000
EXPO_PUBLIC_GOOGLE_MAPS_KEY=<your-google-maps-api-key>
```

To get your PC IP:

```bash
hostname -I | awk '{print $1}'
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.12:8000
```

## 8. Start the mobile app

```bash
npm run start
```

Then:

* Press **i** to run on iOS simulator (Mac only)
* Press **a** for Android emulator
* Or scan QR using Expo Go (same Wi-Fi)

---

## Google Maps Setup

To enable navigation features:

1. Go to **Google Cloud Console**
2. Create a project
3. Enable these APIs:

   * Maps SDK for Android
   * Maps SDK for iOS
   * Directions API
   * Places API
   * Geocoding API
4. Create an API key and restrict it to your app
5. Add key to mobile `.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR_KEY_HERE
```

---

## API Endpoints

### Auth

* `POST /auth/register` – create account
* `POST /auth/verify` – verify OTP / admission code
* `POST /auth/login` – login user

### Detection

* `POST /predict/image` – run YOLO + depth on image

Example request:

```bash
curl -X POST http://127.0.0.1:8000/predict/image \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg"
```

Example response:

```json
{
  "boxes": [
    { "label": "person", "confidence": 0.91, "x": 120, "y": 70, "w": 220, "h": 360, "distance": 1.9 }
  ],
  "image_width": 640,
  "image_height": 480
}
```

---

## Project Structure

```
object-detector/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── auth.py              # auth routes
│   │   ├── detect.py            # detection endpoints
│   │   ├── utils.py             # hashing, jwt, helpers
│   │   ├── models/              # DB models
│   │   └── services/            # YOLO + depth services
│   ├── models/                  # trained weights (git-ignored)
│   ├── requirements.txt
│   └── .env
│
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── CameraScreen.tsx       # realtime detection view
│   │   │   ├── MapScreen.tsx          # google maps navigation
│   │   │   └── HistoryScreen.tsx
│   │   ├── navigation/
│   │   ├── context/
│   │   ├── api/
│   │   └── theme/
│   ├── App.tsx
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Model Artifacts

Model weight files are **not stored on GitHub** due to size.

To use detection:

1. Download / train YOLO weights
2. Place in:

   ```
   backend/models/yolov8.pt
   backend/models/midas.pt
   ```
3. Restart backend

---

## Troubleshooting

### ❌ Mobile says “Network request failed / timed out”

* Ensure backend is running
* Ensure phone and PC are on same Wi-Fi
* Use PC IP in mobile `.env`
* Restart expo:

```bash
npm run start -- --clear
```

### ❌ iOS Camera not ready / Image could not be captured

* Wait for `onCameraReady`
* Use real device if simulator fails
* Ensure permissions granted in Settings

### ❌ No detections show

* Confirm backend returns results:

  ```bash
  curl http://<pc-ip>:8000/health
  ```
* Test `/predict/image` directly
* Check model paths in backend `.env`

---

## Future Improvements

* Offline detection & TTS
* Multi-language voice feedback
* Better object tracking between frames
* Custom user risk levels (warn earlier/late)

---

## Contributing

Pull requests are welcome.
If you add features, please update the docs and keep code clean.

---

## License

MIT License.
