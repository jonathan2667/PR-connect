# PR-connect

A professional platform for AI-powered press release creation and management.

## Project Structure

```
PR-connect/
├── backend/                 # Backend Python application
│   ├── __init__.py         # Package initialization
│   ├── app.py             # Flask application
│   ├── agent.py           # Press release generation agent
│   └── requirements.txt   # Python dependencies
│
├── frontend/               # Frontend assets
│   ├── static/            # Static files (CSS, JS, images)
│   └── templates/         # HTML templates
│       ├── press_release.html
│       └── simple.html
│
└── README.md              # This file
```

## Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python app.py
   ```

The application will be available at `http://localhost:5000`

## Features

- AI-powered press release generation
- Multiple outlet-specific formats
- Professional templates
- Real-time generation
- Customizable content

## Development

- Backend: Python/Flask
- Frontend: HTML/CSS/JavaScript
- Agent: uAgents framework

## License

[Your License Here]
