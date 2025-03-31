from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# System prompt for the AI
SYSTEM_PROMPT = """You are an AI travel planning assistant that helps users create personalized travel itineraries.

IMPORTANT GUIDELINES:
1. Engage in a conversation to gather all necessary travel details.
2. Ask clarifying questions when information is missing.
3. Be friendly, enthusiastic, and knowledgeable about travel destinations.
4. When you have enough information, generate a detailed day-by-day itinerary.

REQUIRED INFORMATION TO COLLECT:
- Destination
- Trip duration (number of days)
- Travel dates (if available)
- Budget level (budget, mid-range, luxury)
- Travel preferences (e.g., food, culture, adventure, relaxation)
- Special requirements (dietary restrictions, accessibility needs)
- Accommodation preferences
- Transportation preferences

CONVERSATION FLOW:
1. Welcome the user and ask about their travel plans.
2. Ask follow-up questions to gather missing information.
3. Once you have sufficient details, inform the user you'll create an itinerary.
4. Generate a detailed day-by-day itinerary based on their preferences.

ITINERARY FORMAT:
When generating the final itinerary, format it as JSON between ITINERARY_START and ITINERARY_END markers.
The JSON should follow this structure:

ITINERARY_START
{
  "destination": "City, Country",
  "startDate": "YYYY-MM-DD", (if provided)
  "endDate": "YYYY-MM-DD", (if provided)
  "duration": 5, (number of days)
  "travelerInfo": {
    "budget": "Budget/Mid-range/Luxury",
    "preferences": ["Food", "Culture", "Adventure"],
    "dietaryRestrictions": ["Vegetarian", "Gluten-free"] (if applicable)
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", (if dates provided)
      "activities": [
        {
          "time": "Morning",
          "activity": "Visit the Museum",
          "location": "Museum Address",
          "notes": "Opens at 9 AM, plan to spend 2 hours"
        },
        {
          "time": "Afternoon",
          "activity": "Lunch at local restaurant",
          "location": "Restaurant name and area",
          "notes": "Famous for local cuisine"
        }
      ]
    }
  ]
}
ITINERARY_END

Only generate the itinerary when you have sufficient information. If information is missing, continue the conversation to gather more details."""

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat API requests"""
    try:
        # Get the request data
        data = request.json
        print(f"Received chat request with {len(data.get('messages', []))} messages")
        messages = data.get('messages', [])
        
        # Check if GROQ_API_KEY is set
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            print("GROQ_API_KEY environment variable is not set")
            return jsonify({'error': 'GROQ_API_KEY environment variable is not set'}), 500
        
        # Prepare messages for the API call
        api_messages = [{'role': msg['role'], 'content': msg['content']} for msg in messages]
        
        # Add system message
        api_messages.insert(0, {'role': 'system', 'content': SYSTEM_PROMPT})
        
        # Make request to Groq API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'llama3-70b-8192',
            'messages': api_messages,
            'temperature': 0.7,
            'max_tokens': 4000,
            'stream': False  # Set to False for simplicity
        }
        
        print("Sending request to Groq API...")
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers=headers,
            json=payload
        )
        
        # Check if the response is successful
        if response.status_code != 200:
            print(f"Groq API error: {response.status_code} - {response.text}")
            return jsonify({'error': f'Groq API error: {response.text}'}), response.status_code
        
        # Parse the response
        result = response.json()
        ai_message = result['choices'][0]['message']['content']
        print(f"Received response from Groq API: {ai_message[:100]}...")
        
        # Check if the message contains an itinerary
        itinerary = None
        if 'ITINERARY_START' in ai_message and 'ITINERARY_END' in ai_message:
            try:
                itinerary_json = ai_message.split('ITINERARY_START')[1].split('ITINERARY_END')[0].strip()
                itinerary = json.loads(itinerary_json)
                print("Successfully parsed itinerary")
            except Exception as e:
                print(f"Error parsing itinerary: {e}")
        
        # Return the response
        return jsonify({
            'message': ai_message,
            'itinerary': itinerary
        })
        
    except Exception as e:
        print(f"Error in chat API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to process chat request: {str(e)}'}), 500
if __name__ == '__main__':
    app.run(debug=True)