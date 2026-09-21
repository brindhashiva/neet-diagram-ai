# NEET Diagram Intelligence Agent

An AI-powered educational platform for NEET students to upload biology and physics diagrams and receive comprehensive AI-driven analysis including component breakdowns, generated questions, flashcards, and revision notes.

## Features

### Core Features
- **Upload Diagrams**: Support for PNG, JPG, JPEG, WEBP formats (up to 16MB)
- **AI Diagram Analysis**: Automatic identification and analysis using Google Gemini AI
- **Component Breakdown**: Detailed explanation of each diagram component with functions and memory tricks
- **Question Generation**: 
  - 10 MCQ Questions
  - 5 Assertion-Reason Questions
  - 5 Match the Following Questions
  - 10 One-Word Questions
- **Confusion Clarification**: Explains commonly confused concepts
- **High Yield Points**: NEET exam-focused revision facts
- **Flashcard Generator**: Interactive flashcards for quick revision
- **PDF Export**: Export complete analysis as PDF

### Supported Diagrams
- Heart
- Nephron
- Human Eye
- Brain
- Flower
- Cell Structure
- Ray Diagrams
- Electric Circuits
- Other NEET-related diagrams

### Additional Features
- **Dashboard**: View statistics and recent uploads
- **History**: Browse all analyzed diagrams
- **Light/Dark Mode**: Professional theme toggle
- **Responsive Design**: Mobile-friendly interface
- **Database Storage**: SQLite database for history management

## Installation

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Google API Key (for Generative AI)

### Step 1: Clone or Extract the Project

```bash
cd /path/to/neet-diagram-ai
```

### Step 2: Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your Google API Key:
```
GOOGLE_API_KEY=your_actual_api_key_here
```

**Get your API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key to your `.env` file

### Step 5: Run the Application

```bash
python app.py
```

The application will start at `http://localhost:5000`

## Usage

### Uploading a Diagram

1. Navigate to the **Analyze** page (home page)
2. Click the upload area or drag and drop a diagram image
3. Supported formats: PNG, JPG, JPEG, WEBP (max 16MB)
4. Wait for AI analysis to complete

### Viewing Analysis Results

After upload, you'll see:
- **Diagram Information**: Name, subject, and chapter
- **Components Tab**: Each component with function, explanation, memory tricks, and exam importance
- **Confusion Points Tab**: Clarification of commonly confused concepts
- **High Yield Points Tab**: Key revision points for NEET exams
- **MCQ Questions**: 10 multiple choice questions
- **Assertion-Reason Questions**: 5 assertion-reason format questions
- **Match Following**: 5 matching questions
- **One-Word Questions**: 10 one-word answer questions
- **Flashcards**: Interactive flashcards for quick revision

### Dashboard

View your analysis statistics:
- Total diagrams analyzed
- Biology vs Physics diagrams
- Total questions generated
- Recent uploads

### History

Browse all previously analyzed diagrams:
- Search by diagram name
- Filter by subject
- View full analysis details
- Export individual diagrams as PDF
- Delete diagrams

## Project Structure

```
neet-diagram-ai/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── database.db                 # SQLite database (auto-created)
├── .env.example               # Environment variables template
├── README.md                  # This file
│
├── templates/                 # HTML Templates
│   ├── index.html            # Main analysis page
│   ├── dashboard.html        # Statistics dashboard
│   └── history.html          # Diagram history page
│
├── static/                    # Static files
│   ├── css/
│   │   └── style.css         # Responsive styling with light/dark mode
│   └── js/
│       ├── main.js           # Main page functionality
│       ├── history.js        # History page functionality
│       └── theme.js          # Theme toggle functionality
│
└── uploads/                   # Uploaded diagrams (auto-created)
```

## Database Schema

### Diagrams Table
```sql
CREATE TABLE diagrams (
    id INTEGER PRIMARY KEY,
    filename TEXT,
    diagram_name TEXT,
    subject TEXT,
    chapter TEXT,
    analysis TEXT,
    components TEXT (JSON),
    mcqs TEXT (JSON),
    assertion_questions TEXT (JSON),
    match_questions TEXT (JSON),
    one_word_questions TEXT (JSON),
    confusion_points TEXT (JSON),
    high_yield_points TEXT (JSON),
    revision_summary TEXT,
    flashcards TEXT (JSON),
    uploaded_at TIMESTAMP
);
```

## API Endpoints

### Upload Diagram
```
POST /api/upload
- Accepts multipart/form-data with image file
- Returns: { success: true, diagram_id: int, analysis: object }
```

### Get Diagram Details
```
GET /api/diagram/<diagram_id>
- Returns: Complete diagram analysis data
```

### Export PDF
```
GET /api/diagram/<diagram_id>/export-pdf
- Returns: PDF file of analysis and revision notes
```

### Get Statistics
```
GET /api/stats
- Returns: { total_diagrams, biology_diagrams, physics_diagrams, questions_generated }
```

### Delete Diagram
```
DELETE /api/diagram/<diagram_id>
- Returns: { success: true }
```

## Keyboard Shortcuts

- `Tab` - Switch between analysis tabs
- `Escape` - Close modals

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Fast image upload and processing
- Instant theme switching
- Smooth animations and transitions
- Optimized for mobile devices
- Responsive design that adapts to all screen sizes

## Troubleshooting

### Issue: "API Key not configured"
**Solution**: Make sure your `.env` file has the correct `GOOGLE_API_KEY` set.

### Issue: "Failed to analyze diagram"
**Solution**: Check that the image is clear and not corrupted. Try a different diagram image.

### Issue: Database errors
**Solution**: Delete `database.db` and restart the app. The database will be recreated.

### Issue: Upload not working
**Solution**: 
- Ensure file size is under 16MB
- Verify file format is PNG, JPG, JPEG, or WEBP
- Check browser console for detailed error messages

### Issue: Port 5000 already in use
**Solution**: 
```bash
# Change port in app.py
app.run(debug=True, host='0.0.0.0', port=5001)
```

## Advanced Configuration

### Change Upload Folder
Edit in `app.py`:
```python
app.config['UPLOAD_FOLDER'] = 'your_custom_path'
```

### Adjust Maximum File Size
Edit in `app.py`:
```python
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20MB
```

### Production Deployment
For production, use Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Security Notes

- Never commit `.env` file with API keys
- Use environment variables for all sensitive data
- Files are stored with timestamp prefixes to avoid conflicts
- Validate all file uploads
- Use HTTPS in production

## Dependencies

- **Flask**: Web framework
- **google-generativeai**: Google Gemini AI integration
- **Pillow**: Image processing
- **reportlab**: PDF generation
- **Werkzeug**: WSGI utilities

## Future Enhancements

- User authentication and accounts
- Diagram comparison tool
- Batch analysis of multiple diagrams
- Community-contributed notes
- Study group features
- Progress tracking and analytics
- Integration with NEET coaching platforms

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## License

This project is provided as-is for educational purposes.

## Support

For issues, questions, or suggestions:
- Check the troubleshooting section
- Review the README thoroughly
- Check console logs for detailed error messages

## Credits

Built with:
- Flask
- Google Generative AI (Gemini)
- ReportLab for PDF generation
- Modern CSS and Vanilla JavaScript

---

**Happy Studying!** 📚

Remember: This tool is designed to supplement your NEET preparation. Always combine diagram analysis with textbook reading and practice questions for best results.
