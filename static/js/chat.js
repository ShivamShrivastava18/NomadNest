document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-button');
    const itineraryTab = document.getElementById('itinerary-tab');
    const itineraryContent = document.getElementById('itinerary-content');
    
    // Messages array to keep track of the conversation
    let messages = [];
    
    // Add initial welcome message
    addMessage('assistant', "Hi! Welcome to AI Travel Planner! I'm here to help you create a personalized travel itinerary. Tell me about your travel plans - where would you like to go, for how long, and what kinds of activities interest you?");
    
    // Handle form submission
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage('user', message);
        
        // Clear input
        userInput.value = '';
        
        // Disable input while waiting for response
        userInput.disabled = true;
        sendButton.disabled = true;
        
        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'message-row';
        loadingDiv.innerHTML = `
            <div class="avatar ai-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
            </div>
            <div class="message ai-message">
                <div class="message-content">
                    <div class="loading"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Send message to API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: message }]
                })
            });
            
            // Remove loading indicator
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatMessages.removeChild(loadingElement);
            }
            
            if (!response.ok) {
                throw new Error('Failed to get response from API');
            }
            
            const data = await response.json();
            
            // Add AI message to chat
            let aiMessage = data.message;
            
            // Remove itinerary JSON if present
            if (aiMessage.includes('ITINERARY_START') && aiMessage.includes('ITINERARY_END')) {
                aiMessage = aiMessage.split('ITINERARY_START')[0];
            }
            
            addMessage('assistant', aiMessage);
            
            // Check if itinerary is available
            if (data.itinerary) {
                // Enable itinerary tab
                itineraryTab.disabled = false;
                
                // Generate itinerary HTML
                renderItinerary(data.itinerary);
                
                // Switch to itinerary tab
                const itineraryTabEl = new bootstrap.Tab(itineraryTab);
                itineraryTabEl.show();
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            // Remove loading indicator if it still exists
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                chatMessages.removeChild(loadingElement);
            }
            
            // Show error message
            addMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
        } finally {
            // Re-enable input
            userInput.disabled = false;
            sendButton.disabled = false;
        }
    });
    
    // Function to add a message to the chat
    function addMessage(role, content) {
        // Add message to messages array
        messages.push({ role, content });
        
        // Create message element
        const messageRow = document.createElement('div');
        messageRow.className = 'message-row';
        
        if (role === 'user') {
            messageRow.innerHTML = `
                <div class="message user-message ms-auto">
                    <div class="message-content">${content}</div>
                </div>
                <div class="avatar user-avatar">
                    <span>U</span>
                </div>
            `;
        } else {
            messageRow.innerHTML = `
                <div class="avatar ai-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                    </svg>
                </div>
                <div class="message ai-message">
                    <div class="message-content">${content}</div>
                </div>
            `;
        }
        
        // Add message to chat
        chatMessages.appendChild(messageRow);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Log for debugging
        console.log(`Added ${role} message: ${content.substring(0, 50)}...`);
    }
    
    // Function to render itinerary
    function renderItinerary(itinerary) {
        let html = `
            <div class="itinerary-header mb-4">
                <h2>${itinerary.destination}</h2>
                <div class="row mt-3">
                    <div class="col-md-4">
                        <p><strong>Duration:</strong> ${itinerary.duration} days</p>
                    </div>
        `;
        
        if (itinerary.startDate && itinerary.endDate) {
            html += `
                <div class="col-md-4">
                    <p><strong>Dates:</strong> ${itinerary.startDate} to ${itinerary.endDate}</p>
                </div>
            `;
        }
        
        if (itinerary.travelerInfo && itinerary.travelerInfo.budget) {
            html += `
                <div class="col-md-4">
                    <p><strong>Budget:</strong> ${itinerary.travelerInfo.budget}</p>
                </div>
            `;
        }
        
        html += `</div>`;
        
        if (itinerary.travelerInfo && itinerary.travelerInfo.preferences) {
            html += `
                <div class="preferences mt-2">
                    <p><strong>Preferences:</strong> ${itinerary.travelerInfo.preferences.join(', ')}</p>
                </div>
            `;
        }
        
        html += `
            <div class="d-flex justify-content-end mb-3">
                <button class="btn btn-outline-primary me-2" id="print-itinerary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-printer" viewBox="0 0 16 16">
                        <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                        <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
                    </svg>
                    Print
                </button>
                <button class="btn btn-outline-primary" id="download-itinerary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                    Download
                </button>
            </div>
        `;
        
        // Add days tabs
        html += `
            <ul class="nav nav-tabs" id="daysTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="all-days-tab" data-bs-toggle="tab" data-bs-target="#all-days" type="button" role="tab" aria-controls="all-days" aria-selected="true">All Days</button>
                </li>
        `;
        
        itinerary.days.forEach((day, index) => {
            html += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="day-${day.day}-tab" data-bs-toggle="tab" data-bs-target="#day-${day.day}" type="button" role="tab" aria-controls="day-${day.day}" aria-selected="false">Day ${day.day}</button>
                </li>
            `;
        });
        
        html += `</ul>`;
        
        // Add tab content
        html += `<div class="tab-content" id="daysTabContent">`;
        
        // All days tab
        html += `
            <div class="tab-pane fade show active" id="all-days" role="tabpanel" aria-labelledby="all-days-tab">
                <div class="days-container mt-3">
        `;
        
        itinerary.days.forEach(day => {
            html += renderDay(day);
        });
        
        html += `
                </div>
            </div>
        `;
        
        // Individual day tabs
        itinerary.days.forEach(day => {
            html += `
                <div class="tab-pane fade" id="day-${day.day}" role="tabpanel" aria-labelledby="day-${day.day}-tab">
                    ${renderDay(day)}
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Set the HTML
        itineraryContent.innerHTML = html;
        
        // Add event listeners for print and download buttons
        document.getElementById('print-itinerary').addEventListener('click', function() {
            printItinerary(itinerary);
        });
        
        document.getElementById('download-itinerary').addEventListener('click', function() {
            downloadItinerary(itinerary);
        });
    }
    
    // Function to render a day
    function renderDay(day) {
        let html = `
            <div class="card day-card">
                <div class="card-header">
                    <h3>Day ${day.day}${day.date ? ` - ${day.date}` : ''}</h3>
                </div>
                <div class="card-body">
        `;
        
        day.activities.forEach(activity => {
            html += `
                <div class="activity">
                    ${activity.time ? `<p class="text-primary fw-bold">${activity.time}</p>` : ''}
                    <h5>${activity.activity}</h5>
                    ${activity.location ? `<p><strong>Location:</strong> ${activity.location}</p>` : ''}
                    ${activity.notes ? `<p class="text-muted fst-italic">${activity.notes}</p>` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Function to print itinerary
    function printItinerary(itinerary) {
        const printWindow = window.open('', '_blank');
        
        let html = `
            <html>
                <head>
                    <title>Travel Itinerary - ${itinerary.destination}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #007bff; }
                        .day { margin-bottom: 20px; }
                        .day-header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
                        .activity { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; }
                        .time { font-weight: bold; color: #007bff; }
                        .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Travel Itinerary - ${itinerary.destination}</h1>
                    <div class="summary">
                        <p><strong>Duration:</strong> ${itinerary.duration} days</p>
                        ${itinerary.startDate ? `<p><strong>Dates:</strong> ${itinerary.startDate} to ${itinerary.endDate}</p>` : ''}
                        ${itinerary.travelerInfo?.budget ? `<p><strong>Budget:</strong> ${itinerary.travelerInfo.budget}</p>` : ''}
                        ${itinerary.travelerInfo?.preferences ? `<p><strong>Preferences:</strong> ${itinerary.travelerInfo.preferences.join(', ')}</p>` : ''}
                    </div>
                    ${itinerary.days.map(day => `
                        <div class="day">
                            <div class="day-header">
                                <h2>Day ${day.day}${day.date ? ` - ${day.date}` : ''}</h2>
                            </div>
                            ${day.activities.map(activity => `
                                <div class="activity">
                                    ${activity.time ? `<p class="time">${activity.time}</p>` : ''}
                                    <p><strong>${activity.activity}</strong></p>
                                    ${activity.location ? `<p>Location: ${activity.location}</p>` : ''}
                                    ${activity.notes ? `<p>Notes: ${activity.notes}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
    
    // Function to download itinerary
    function downloadItinerary(itinerary) {
        let text = `TRAVEL ITINERARY - ${itinerary.destination.toUpperCase()}\n\n`;
        text += `Duration: ${itinerary.duration} days\n`;
        
        if (itinerary.startDate) {
            text += `Dates: ${itinerary.startDate} to ${itinerary.endDate}\n`;
        }
        
        if (itinerary.travelerInfo?.budget) {
            text += `Budget: ${itinerary.travelerInfo.budget}\n`;
        }
        
        if (itinerary.travelerInfo?.preferences) {
            text += `Preferences: ${itinerary.travelerInfo.preferences.join(', ')}\n`;
        }
        
        text += '\n';
        
        itinerary.days.forEach(day => {
            text += `DAY ${day.day}${day.date ? ` - ${day.date}` : ''}\n`;
            
            day.activities.forEach(activity => {
                text += `${activity.time ? `${activity.time}: ` : ''}${activity.activity}\n`;
                if (activity.location) {
                    text += `Location: ${activity.location}\n`;
                }
                if (activity.notes) {
                    text += `Notes: ${activity.notes}\n`;
                }
                text += '\n';
            });
            
            text += '\n';
        });
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${itinerary.destination.replace(/\s+/g, '_')}_itinerary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});