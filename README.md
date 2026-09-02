# speaklink_glove
# SpeakLink Glove: Real-Time Gesture-to-Speech Translation System

SpeakLink Glove is an advanced assistive communication solution that bridges the gap between non-verbal individuals and hearing audiences. By capturing hand gestures, classifying them using machine learning, and translating the result into natural speech, SpeakLink enables seamless, real-time communication for sign language users.

## 🚀 Key Features

- **Real-Time Translation**: Instant conversion of gestures into spoken language with `< 1.5s` response time.
- **Multi-Language Support**: Translate to English, Tamil, Hindi, Malayalam, and more.
- **Advanced AI Pipeline**:
  - **Gesture Recognition**: Captures 9-DOF sensor data (accelerometer, gyroscope, magnetometer).
  - **ML Classification**: Uses **Linear SVM** for high-accuracy gesture classification.
  - **Neural Translation**: Powered by **Google Translate** for natural, context-aware translations.
- **Live Communication Dashboard**:
  - **Live Video Feed**: View the user in real-time.
  - **Live Translation**: See translated messages as they are spoken.
  - **Live Audio**: Hear the translation spoken aloud.
- **SOS Safety Feature**:
  - **SOS Button**: Instant alert mechanism for emergencies.
  - **GPS Tracking**: Automatically captures and displays the user's location during distress.
  - **Alert History**: Logs all emergency events with timestamps and locations.
- **Smart Alerts**:
  - **Real-Time Translation**: No delays in alerting.
  - **User Verification**: Verifies identity via RFID before sending alerts.
- **Progressive Web App (PWA)**:
  - **Offline Support**: Continues to function even without an internet connection.
  - **Installable**: Can be installed on mobile devices for quick access.
  - **Responsive Design**: Optimized for both desktop and mobile.

## 📡 System Architecture

1. **Hardware Layer**
   - **Gesture Sensor**: Captures 9-DOF IMU data (Accelerometer, Gyroscope, Magnetometer).
   - **RFID Reader**: Scans RFID tags for user identification.

2. **Backend Services**
   - **FastAPI**: High-performance Python web framework.
   - **Supabase**: Real-time database for data ingestion and synchronization.
   - **gRPC**: High-performance inter-service communication.

3. **Machine Learning Pipeline**
   - **Model**: Linear SVM Classifier.
   - **Training**: Pre-trained model ready for inference.
   - **Inference**: Real-time gesture classification.

4. **AI Services**
   - **Translation**: Google Translate API for neural machine translation.
   - **Text-to-Speech (TTS)**: Converts text to natural speech.

5. **Frontend**
   - **React 19 + TypeScript**: Modern, type-safe user interface.
   - **Vite**: Fast build tool and development server.
   - **Tailwind CSS**: Utility-first CSS for rapid styling.
   - **Three.js**: 3D rendering for interactive glove visualization.
   - **Recharts**: Data visualization for charts and graphs.

## 💻 Getting Started

### Prerequisites
- **Node.js** >= 16.0.0
- **Python** >= 3.10
- **Supabase Account**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jairus25/speaklink_glove.git
   cd speaklink_glove
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Backend**
   - Create a `.env` file in the `backend/` directory:
     ```env
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     SUPABASE_TABLE=your_table
     ```

4. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Configure Frontend**
   - Create a `.env` file in the `frontend/` directory:
