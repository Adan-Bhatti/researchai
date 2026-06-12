<div align="center">

# 🔬 ResearchAI

**An AI-powered research assistant that generates comprehensive, structured research reports from a single query — featuring a modern React frontend and a Python backend.**

[![CI](https://github.com/Adan-Bhatti/researchai/actions/workflows/ci.yml/badge.svg)](https://github.com/Adan-Bhatti/researchai/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Features

- 🧠 **AI-Powered Research** — Submit any topic and receive a structured, comprehensive research report
- ⚡ **Real-time Streaming** — Results stream progressively to the frontend as they are generated
- 🎨 **Modern UI** — Built with React 19, Radix UI, Tailwind CSS, and Lucide icons
- 📊 **Rich Output** — Reports include summaries, key findings, and structured sections
- 🔌 **REST API Backend** — Clean Python backend with a modular prompt generation system

---

## 🏗️ Architecture

```
+-------------------------------+
|      React Frontend           |
|  (Create React App + Craco)   |
|  Radix UI · Tailwind · Axios  |
+---------------+---------------+
                |
                | HTTP / REST
+---------------v---------------+
|      Python Backend           |
|  server.py                    |
|  prompt_generator.py          |
+-------------------------------+
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.10+

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The backend runs at **http://localhost:8000** by default.

### Frontend

```bash
cd frontend
yarn install
yarn start
```

The app opens at **http://localhost:3000**

---

## 📁 Project Structure

```
researchai/
├── backend/
│   ├── server.py              # API server entry point
│   ├── prompt_generator.py    # AI prompt construction logic
│   ├── requirements.txt       # Python dependencies
│   └── tests/                 # Backend test suite
├── frontend/
│   ├── src/                   # React components and pages
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── tailwind.config.js     # Tailwind configuration
└── tests/                     # Integration tests
```

---

## 🧪 Running Tests

**Backend:**
```bash
cd backend
pip install pytest
pytest tests/
```

**Frontend:**
```bash
cd frontend
yarn test
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Adan Bhatti** · [GitHub](https://github.com/Adan-Bhatti)
