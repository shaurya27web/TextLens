# 📄 TextLens — Handwriting to PDF App

> Scan handwritten or printed text with your phone camera → OCR extracts the text → Beautiful PDF is generated instantly.

---

## 🏗️ Project Structure

```
TextLensApp/
├── backend/                  # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── server.js         # Entry point
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── models/
│   │   │   ├── Document.js   # Document schema
│   │   │   └── User.js       # User schema
│   │   ├── controllers/
│   │   │   ├── ocrController.js       # OCR + PDF processing
│   │   │   └── documentController.js  # CRUD operations
│   │   ├── routes/
│   │   │   ├── ocrRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── middleware/upload.js  # Multer file upload
│   │   └── utils/
│   │       ├── ocrUtils.js   # Tesseract OCR logic
│   │       └── pdfUtils.js   # PDFKit generation
│   ├── package.json
│   └── .env
│
└── frontend/                 # React Native + Expo
    ├── App.js
    ├── app.json
    ├── src/
    │   ├── navigation/AppNavigator.js
    │   ├── screens/
    │   │   ├── HomeScreen.js     # Welcome / landing
    │   │   ├── ScanScreen.js     # Camera + OCR + result
    │   │   └── HistoryScreen.js  # All scanned documents
    │   └── services/api.js       # Axios API calls
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (Community Edition) → https://www.mongodb.com/try/download/community
- **Expo CLI** → `npm install -g expo-cli`
- **Expo Go** app on your physical phone (iOS/Android) from the App Store / Play Store
- **VS Code** (you already have this ✅)

---

## 🚀 Setup & Run

### Step 1 — Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /data/db
```

### Step 2 — Backend Setup
```bash
cd TextLensApp/backend
npm install
```

Edit `.env` if needed (default MongoDB URI is fine for local):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/textlens
```

Start backend:
```bash
npm run dev      # development (with auto-reload)
# OR
npm start        # production
```

You should see:
```
🚀 TextLens Server running on port 5000
✅ MongoDB Connected: localhost
```

### Step 3 — Find your local IP address
Your phone and computer must be on the **same WiFi**.

```bash
# Windows
ipconfig
# Look for "IPv4 Address" e.g. 192.168.1.105

# macOS/Linux
ifconfig | grep "inet "
```

### Step 4 — Update API URL in frontend
Open `frontend/src/services/api.js` and update:
```js
const BASE_URL = 'http://YOUR_IP_HERE:5000/api';
// Example: 'http://192.168.1.105:5000/api'
```

### Step 5 — Frontend Setup
```bash
cd TextLensApp/frontend
npm install
expo start
```

A QR code will appear in the terminal.

### Step 6 — Open on your phone
1. Open **Expo Go** on your phone
2. Scan the QR code
3. The app will load! 🎉

---

## 📱 App Flow

```
Home Screen
    ↓ Tap "Start Scanning"
Scan Screen (Camera View)
    ↓ Take photo OR pick from gallery
Image Preview
    ↓ Tap "Extract Text & PDF"
Processing Screen (OCR running...)
    ↓ Done!
Result Screen
    - View extracted digital text
    - See accuracy %, word count, processing time
    - Download / share PDF
    ↓ History Screen
All previously scanned documents with PDF links
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ocr/process-base64` | Process base64 image from camera |
| POST | `/api/ocr/process` | Process multipart image upload |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/:id` | Get single document |
| PUT | `/api/documents/:id` | Update document title |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/health` | Health check |

---

## 🧪 Test Backend (without phone)

```bash
# Health check
curl http://localhost:5000/health

# Process a test image (base64)
curl -X POST http://localhost:5000/api/ocr/process-base64 \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "data:image/jpeg;base64,YOUR_BASE64_HERE", "title": "Test"}'

# Get documents
curl http://localhost:5000/api/documents
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo |
| Camera | expo-camera |
| Navigation | React Navigation v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| OCR Engine | Tesseract.js v5 |
| Image Processing | Sharp |
| PDF Generation | PDFKit |
| File Upload | Multer |

---

## 🔧 Troubleshooting

**"Network request failed" on phone**
→ Make sure phone and PC are on same WiFi
→ Double-check IP in `api.js`
→ Make sure backend is running on port 5000
→ Disable firewall temporarily to test

**OCR giving wrong results**
→ Ensure good lighting when scanning
→ Hold camera steady
→ Text should fill most of the frame
→ Use the scan frame overlay as a guide

**MongoDB connection failed**
→ Verify MongoDB service is running
→ Check `MONGODB_URI` in `.env`

**Expo app not loading**
→ Make sure you're on the same network
→ Try pressing `r` in the expo terminal to reload
→ Try closing and reopening Expo Go

---

## 📦 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/textlens
NODE_ENV=development
```

---

## 🔮 Future Enhancements

- [ ] Multi-page document scanning
- [ ] Language selection (Hindi, French, Spanish, etc.)
- [ ] Cloud sync (AWS S3 / Firebase)
- [ ] User authentication (JWT)
- [ ] PDF editing / annotations
- [ ] Batch scan mode
- [ ] Dark mode UI
