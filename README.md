# Insta-Fit – AI Virtual Trial Room

AI-powered virtual trial room that allows users to visualize clothing on their body in real time using computer vision, pose detection, and garment extraction from e-commerce product links.

---

## Overview

Insta-Fit is an AI-based virtual try-on system designed to enhance the online shopping experience. The system enables users to preview clothing items on their body without physically wearing them.

Users can paste product links from online shopping platforms such as Myntra or Amazon, and the system automatically extracts the clothing image and overlays it onto the user's body using real-time pose detection and computer vision techniques.

This project combines Artificial Intelligence, Computer Vision, and Image Processing to create an interactive and contactless clothing trial experience.

---

## Features

- Real-time virtual garment visualization
- Live camera-based body detection
- Automatic garment extraction from product links
- AI background removal for clothing images
- Pose detection using MediaPipe
- Dynamic garment alignment and rendering
- Integration of computer vision and AI techniques

---

## Technology Stack

### Frontend
- Streamlit / Web Interface
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask

### Computer Vision
- OpenCV
- MediaPipe

### Image Processing
- rembg (AI background removal)

### Web Scraping
- Selenium
- BeautifulSoup

### Database
- MySQL / SQLite

---

## System Architecture
``` bash
User
│
▼
Camera Input
│
▼
Frontend Interface (Streamlit/Web UI)
│
▼
Backend Server (Python/Flask)
│
├── Product URL Analyzer
│
├── Web Scraper (Extract Clothing Image)
│
├── Image Processing (Background Removal)
│
├── Pose Detection (MediaPipe)
│
▼
Garment Mapping Engine
│
▼
Database (MySQL/SQLite)
│
▼
Virtual Try-On Display
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/yourusername/Insta-Fit.git
cd Insta-Fit
pip install -r requirements.txt
python app.py
```
## Project Structure
```bash
Insta-Fit
│
├── frontend
│   └── UI interface files
│
├── backend
│   └── API and server logic
│
├── ai_modules
│   ├── pose_detection
│   ├── garment_mapping
│   └── image_processing
│
├── database
│   └── database configuration
│
├── assets
│   └── images and resources
│
├── app.py
├── requirements.txt
└── README.md
```
## Applications

- Online fashion shopping platforms

- Smart retail mirrors in stores

- Virtual fashion technology systems

- Augmented reality shopping solutions


## License

This project is licensed under the MIT License.

### Author

Abhishek Kumar
MCA – AI/ML Major
Major Project – Insta- Fit AI Virtual Trial Room

© 2026 Abhishek Kumar – AI Virtual Trial Room Project
