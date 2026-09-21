#!/bin/bash

# NEET Diagram Intelligence Agent - Startup Script

echo "NEET Diagram Intelligence Agent"
echo "================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  WARNING: .env file not found!"
    echo "Please create .env file with your Google API Key:"
    echo "  1. Copy .env.example to .env"
    echo "  2. Edit .env and add your GOOGLE_API_KEY"
    echo "  3. Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press Enter to continue anyway (AI features won't work)..."
fi

# Run the application
echo ""
echo "Starting NEET Diagram Intelligence Agent..."
echo "The application will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""

python app.py
