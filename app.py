import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import google.generativeai as genai
from PIL import Image
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import base64

# Configuration
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Generative AI
api_key = os.environ.get('GOOGLE_API_KEY', '')
if api_key and 'GOOGLE_API_KEY' not in api_key and api_key.strip():
    try:
        genai.configure(api_key=api_key)
        print(f"✓ Google Generative AI configured successfully")
    except Exception as e:
        print(f"⚠ Warning: Failed to configure Google Generative AI: {e}")
else:
    print("⚠ Warning: GOOGLE_API_KEY not set or invalid. AI features may not work.")

# Database setup
DATABASE = 'database.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database schema"""
    conn = get_db()
    c = conn.cursor()
    
    # Diagrams table
    c.execute('''CREATE TABLE IF NOT EXISTS diagrams
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  filename TEXT NOT NULL,
                  diagram_name TEXT,
                  subject TEXT,
                  chapter TEXT,
                  analysis TEXT,
                  components TEXT,
                  mcqs TEXT,
                  assertion_questions TEXT,
                  match_questions TEXT,
                  one_word_questions TEXT,
                  confusion_points TEXT,
                  high_yield_points TEXT,
                  revision_summary TEXT,
                  flashcards TEXT,
                  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    conn.commit()
    conn.close()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_image_base64(filepath):
    """Convert image to base64"""
    with open(filepath, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def analyze_diagram(image_path):
    """Analyze diagram using Google Generative AI"""
    try:
        # Check if API key is configured
        api_key = os.environ.get('GOOGLE_API_KEY')
        if not api_key or api_key.strip() == '' or 'GOOGLE_API_KEY' in api_key:
            raise ValueError("Google API key is not configured. Please set GOOGLE_API_KEY in .env file")
        
        # Try the best available models for vision tasks
        models_to_try = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-pro-latest']
        model = None
        model_name_used = None
        
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                model_name_used = model_name
                print(f"✓ Using model: {model_name}")
                break
            except Exception as e:
                print(f"✗ Model {model_name} not available: {str(e)}")
                continue
        
        if model is None:
            raise ValueError("No suitable vision model found. Please check your API key permissions.")
        
        # Read image
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Convert to PIL Image to verify it's valid
        img = Image.open(io.BytesIO(image_data))
        print(f"Image loaded: {img.size}, format: {img.format}")
        
        # Create a comprehensive prompt for NEET analysis
        analysis_prompt = """You are an expert NEET (National Eligibility cum Entrance Test) educator specializing in Biology and Physics diagrams.

TASK: Analyze this diagram in detail from a NEET perspective and return VALID JSON ONLY (no text before or after).

INSTRUCTIONS:
1. Identify the exact diagram name and type
2. Classify into Biology or Physics
3. Identify all labeled components
4. Provide educational explanations suitable for NEET students
5. Generate NEET-relevant questions
6. Include exam-focused content

Return this exact JSON structure (and ONLY this JSON, no other text):

{
    "diagram_name": "Exact name (e.g., 'Neuron Structure', 'Heart Cross-Section', 'Nephron Function')",
    "subject": "Biology or Physics",
    "chapter": "NEET chapter (e.g., 'Nervous System', 'Circulatory System', 'Excretory System')",
    "description": "Educational description of what this diagram shows and its importance in NEET",
    "components": [
        {
            "name": "Component name from diagram",
            "function": "Specific function in ONE sentence",
            "detailed_explanation": "2-3 sentences with detailed information",
            "memory_trick": "Mnemonic or memory aid for remembering",
            "exam_importance": "Why NEET asks about this component"
        }
    ],
    "common_confusions": [
        {
            "pair": "Component A vs Component B",
            "difference": "Clear distinction for NEET exams"
        }
    ],
    "high_yield_points": [
        "High-importance point 1",
        "High-importance point 2",
        "High-importance point 3"
    ],
    "quick_revision": "Concise 2-3 sentence summary",
    "mcqs": [
        {
            "question": "Clear MCQ question about diagram",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option X",
            "explanation": "Why this is correct"
        }
    ],
    "assertion_reason_questions": [
        {
            "assertion": "Clear statement about diagram",
            "reason": "Reason for the assertion",
            "correct_option": "Both are true and reason explains assertion"
        }
    ],
    "match_following": [
        {
            "left": "Structure from diagram",
            "right": "Its function/characteristic",
            "explanation": "Why they match"
        }
    ],
    "one_word_questions": [
        {
            "question": "What is the name of...?",
            "answer": "Single word"
        }
    ]
}"""

        # Determine MIME type
        mime_type = "image/jpeg"
        if image_path.lower().endswith('.png'):
            mime_type = "image/png"
        elif image_path.lower().endswith('.webp'):
            mime_type = "image/webp"
        
        print(f"Sending image with MIME type: {mime_type}")
        
        # Call Generative AI with image
        response = model.generate_content([
            analysis_prompt,
            {
                "mime_type": mime_type,
                "data": image_data
            }
        ])
        
        # Extract and parse response
        response_text = response.text.strip()
        print(f"\nRaw API Response (first 500 chars):\n{response_text[:500]}\n")
        
        # Try to parse JSON
        try:
            # Find JSON in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx <= start_idx:
                print("Warning: No JSON found in response, attempting text parsing")
                raise ValueError("No JSON found in response")
            
            json_str = response_text[start_idx:end_idx]
            print(f"Extracted JSON (first 300 chars): {json_str[:300]}\n")
            
            analysis_data = json.loads(json_str)
            print(f"✓ Successfully parsed JSON analysis")
            
            # Ensure all required fields exist
            defaults = {
                'diagram_name': 'Diagram Analysis',
                'subject': 'Biology/Physics',
                'chapter': 'Not Determined',
                'description': 'See detailed analysis',
                'components': [],
                'common_confusions': [],
                'high_yield_points': [],
                'quick_revision': 'See analysis tabs',
                'mcqs': [],
                'assertion_reason_questions': [],
                'match_following': [],
                'one_word_questions': []
            }
            
            for key, default_value in defaults.items():
                if key not in analysis_data:
                    analysis_data[key] = default_value
                elif not analysis_data[key] and isinstance(analysis_data[key], list):
                    analysis_data[key] = []
            
            print(f"Analysis complete: {len(analysis_data.get('components', []))} components, {len(analysis_data.get('mcqs', []))} MCQs")
            return analysis_data
            
        except (json.JSONDecodeError, ValueError) as json_err:
            print(f"JSON parsing error: {str(json_err)}")
            print(f"Full response text:\n{response_text}\n")
            
            # Extract text-based information as fallback
            lines = [line.strip() for line in response_text.split('\n') if line.strip()]
            
            analysis_data = {
                "diagram_name": lines[0][:60] if lines else "Diagram",
                "subject": "Biology" if any(w in response_text.lower() for w in ['cell', 'organ', 'tissue', 'biology']) else "Physics",
                "chapter": lines[1][:60] if len(lines) > 1 else "Structure and Function",
                "description": response_text[:250],
                "components": [
                    {
                        "name": f"Component {i+1}",
                        "function": line[:80],
                        "detailed_explanation": line,
                        "memory_trick": "See description",
                        "exam_importance": "Important for NEET"
                    }
                    for i, line in enumerate(lines[2:5])
                ],
                "common_confusions": [{"pair": "See analysis", "difference": "Detailed comparison in description"}],
                "high_yield_points": lines[5:8] if len(lines) > 5 else ["See response"],
                "quick_revision": response_text[:200],
                "mcqs": [{"question": "What is shown?", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "See analysis"}],
                "assertion_reason_questions": [],
                "match_following": [],
                "one_word_questions": []
            }
            print(f"Using fallback analysis with {len(analysis_data['components'])} components")
            return analysis_data
    
    except Exception as e:
        error_msg = f"Analysis Error: {str(e)}"
        print(f"\n❌ Exception in analyze_diagram:\n{error_msg}")
        import traceback
        traceback.print_exc()
        
        return {
            "diagram_name": "Analysis Pending",
            "subject": "Biology/Physics",
            "chapter": "Processing",
            "description": f"AI analysis in progress. Error: {str(e)[:100]}",
            "components": [
                {
                    "name": "Processing",
                    "function": "AI is analyzing your image",
                    "detailed_explanation": "The system is working on the analysis. This may take 10-30 seconds.",
                    "memory_trick": "Please wait",
                    "exam_importance": "Important"
                }
            ],
            "common_confusions": [],
            "high_yield_points": ["Uploading image...", "Processing with AI...", "Generating content..."],
            "quick_revision": "Waiting for analysis",
            "mcqs": [],
            "assertion_reason_questions": [],
            "match_following": [],
            "one_word_questions": []
        }

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard page"""
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT COUNT(*) as total FROM diagrams')
    total = c.fetchone()['total']
    
    c.execute("SELECT COUNT(*) as count FROM diagrams WHERE subject = 'Biology'")
    biology = c.fetchone()['count']
    
    c.execute("SELECT COUNT(*) as count FROM diagrams WHERE subject = 'Physics'")
    physics = c.fetchone()['count']
    
    c.execute('SELECT COUNT(*) as total FROM diagrams WHERE mcqs IS NOT NULL AND mcqs != ""')
    questions = c.fetchone()['total']
    
    c.execute('SELECT * FROM diagrams ORDER BY uploaded_at DESC LIMIT 5')
    recent = c.fetchall()
    
    conn.close()
    
    return render_template('dashboard.html', 
                         total_diagrams=total,
                         biology_count=biology,
                         physics_count=physics,
                         questions_generated=questions,
                         recent_uploads=recent)

@app.route('/history')
def history():
    """History page"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM diagrams ORDER BY uploaded_at DESC')
    diagrams = c.fetchall()
    conn.close()
    
    return render_template('history.html', diagrams=diagrams)

@app.route('/api/upload', methods=['POST'])
def upload_diagram():
    """Upload and analyze diagram"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, WEBP allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze diagram
        analysis_data = analyze_diagram(filepath)
        
        # Save to database
        conn = get_db()
        c = conn.cursor()
        
        c.execute('''INSERT INTO diagrams 
                    (filename, diagram_name, subject, chapter, analysis, 
                     components, mcqs, assertion_questions, match_questions, 
                     one_word_questions, confusion_points, high_yield_points, 
                     revision_summary, flashcards)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (filename,
                  analysis_data.get('diagram_name', 'Unknown'),
                  analysis_data.get('subject', 'Not Determined'),
                  analysis_data.get('chapter', 'Not Determined'),
                  json.dumps(analysis_data.get('description', '')),
                  json.dumps(analysis_data.get('components', [])),
                  json.dumps(analysis_data.get('mcqs', [])),
                  json.dumps(analysis_data.get('assertion_reason_questions', [])),
                  json.dumps(analysis_data.get('match_following', [])),
                  json.dumps(analysis_data.get('one_word_questions', [])),
                  json.dumps(analysis_data.get('common_confusions', [])),
                  json.dumps(analysis_data.get('high_yield_points', [])),
                  analysis_data.get('quick_revision', ''),
                  json.dumps([{'front': c.get('name', ''), 'back': c.get('detailed_explanation', '')} 
                             for c in analysis_data.get('components', [])])))
        
        diagram_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'diagram_id': diagram_id,
            'analysis': analysis_data,
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagram/<int:diagram_id>')
def get_diagram(diagram_id):
    """Get diagram details"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM diagrams WHERE id = ?', (diagram_id,))
        diagram = c.fetchone()
        conn.close()
        
        if not diagram:
            return jsonify({'error': 'Diagram not found'}), 404
        
        # Convert to dictionary
        diagram_dict = dict(diagram)
        
        # Parse JSON fields
        for key in ['components', 'mcqs', 'assertion_questions', 'match_questions', 
                   'one_word_questions', 'confusion_points', 'high_yield_points', 'flashcards']:
            if diagram_dict.get(key):
                try:
                    diagram_dict[key] = json.loads(diagram_dict[key])
                except:
                    diagram_dict[key] = []
        
        # Get image base64
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], diagram_dict['filename'])
        if os.path.exists(image_path):
            diagram_dict['image_base64'] = get_image_base64(image_path)
        
        return jsonify(diagram_dict)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagram/<int:diagram_id>/export-pdf')
def export_pdf(diagram_id):
    """Export diagram analysis as PDF"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM diagrams WHERE id = ?', (diagram_id,))
        diagram = c.fetchone()
        conn.close()
        
        if not diagram:
            return jsonify({'error': 'Diagram not found'}), 404
        
        # Create PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        
        # Container for elements
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=8,
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=10,
            spaceAfter=6
        )
        
        # Title
        elements.append(Paragraph(f"NEET Diagram Analysis: {diagram['diagram_name']}", title_style))
        elements.append(Spacer(1, 12))
        
        # Meta info
        meta_data = [
            ['Subject', diagram['subject']],
            ['Chapter', diagram['chapter']],
            ['Uploaded', diagram['uploaded_at']]
        ]
        meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e2e8f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))
        
        # Analysis section
        elements.append(Paragraph("Analysis", heading_style))
        elements.append(Paragraph(diagram['analysis'], body_style))
        elements.append(Spacer(1, 12))
        
        # Components
        if diagram['components']:
            elements.append(Paragraph("Components", heading_style))
            components = json.loads(diagram['components'])
            for comp in components[:10]:  # Limit to 10 for PDF
                elements.append(Paragraph(f"<b>{comp.get('name', 'N/A')}</b>", body_style))
                elements.append(Paragraph(f"Function: {comp.get('function', 'N/A')}", body_style))
                elements.append(Paragraph(f"Memory Trick: {comp.get('memory_trick', 'N/A')}", body_style))
                elements.append(Spacer(1, 6))
            elements.append(Spacer(1, 12))
        
        # High yield points
        if diagram['high_yield_points']:
            elements.append(Paragraph("High Yield Points", heading_style))
            points = json.loads(diagram['high_yield_points'])
            for i, point in enumerate(points, 1):
                elements.append(Paragraph(f"{i}. {point}", body_style))
            elements.append(Spacer(1, 12))
        
        # Quick revision
        if diagram['revision_summary']:
            elements.append(Paragraph("Quick Revision", heading_style))
            elements.append(Paragraph(diagram['revision_summary'], body_style))
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{diagram['diagram_name']}_analysis.pdf"
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get statistics"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) as total FROM diagrams')
        total = c.fetchone()['total']
        
        c.execute("SELECT COUNT(*) as count FROM diagrams WHERE subject = 'Biology'")
        biology = c.fetchone()['count']
        
        c.execute("SELECT COUNT(*) as count FROM diagrams WHERE subject = 'Physics'")
        physics = c.fetchone()['count']
        
        c.execute('SELECT COUNT(*) as total FROM diagrams WHERE mcqs IS NOT NULL AND mcqs != ""')
        questions = c.fetchone()['total']
        
        conn.close()
        
        return jsonify({
            'total_diagrams': total,
            'biology_diagrams': biology,
            'physics_diagrams': physics,
            'questions_generated': questions
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagram/<int:diagram_id>/delete', methods=['DELETE'])
def delete_diagram(diagram_id):
    """Delete diagram"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute('SELECT filename FROM diagrams WHERE id = ?', (diagram_id,))
        diagram = c.fetchone()
        
        if not diagram:
            conn.close()
            return jsonify({'error': 'Diagram not found'}), 404
        
        # Delete file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], diagram['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Delete from database
        c.execute('DELETE FROM diagrams WHERE id = ?', (diagram_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run app
    app.run(debug=True, host='0.0.0.0', port=5000)
