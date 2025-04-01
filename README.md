# AI Travel Planner

A Flask-based application that uses Groq AI to create personalized travel itineraries based on user preferences.

## Features

- Interactive chat interface to gather travel preferences
- AI-powered travel recommendations
- Detailed day-by-day itinerary generation
- Print and download options for itineraries
- Responsive design for desktop and mobile

## Setup Instructions

1. Clone the repository
2. Create a virtual environment:python -m venv venv source 
                                venv/bin/activate
3. Install dependencies: pip install -r requirements.txt
4. Create a `.env` file with your Groq API key: GROQ_API_KEY=your-api-key-here
5. Run the application:python app.py
6. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Start a conversation by telling the AI about your travel plans
2. Provide details about your destination, dates, budget, and preferences
3. The AI will ask follow-up questions to gather all necessary information
4. Once enough information is collected, the AI will generate a detailed itinerary
5. View, print, or download your personalized travel plan

## Future Improvements

1. Scrape flight and hotel prices and information for specific dates
2. Map and directions of places to visit
