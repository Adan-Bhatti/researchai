# Contributing to ResearchAI

Thank you for contributing to ResearchAI! 🔬

## Project Structure

This is a full-stack project with a **React frontend** and **Python backend**. Make sure to read both sections if your change spans both.

## Getting Started

1. **Fork and clone:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/researchai.git
   cd researchai
   ```

2. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python server.py
   ```

4. **Start frontend:**
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

## Guidelines

### Frontend (React)
- Use functional components with hooks
- Follow existing component patterns using Radix UI primitives
- Run `yarn build` before submitting to ensure no build errors

### Backend (Python)
- Follow [PEP 8](https://peps.python.org/pep-0008/) (max 120 chars)
- Add docstrings to new functions
- Write tests for new API endpoints in `backend/tests/`

## Submitting a Pull Request

1. Push your branch and open a PR against `main`
2. Fill in the PR template
3. Ensure CI passes for both backend and frontend jobs

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md).
