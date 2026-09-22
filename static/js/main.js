// Main JavaScript for NEET Diagram Analysis

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const analysisSection = document.getElementById('analysisSection');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let currentDiagramId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
    setupTabNavigation();
    setupTheme();
});

// Setup upload area
function setupUploadArea() {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

async function handleFile(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.');
        return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
        showError('File is too large. Maximum size is 16MB.');
        return;
    }

    // Upload file
    await uploadDiagram(file);
}

async function uploadDiagram(file) {
    try {
        showLoading(true);
        hideError();

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        currentDiagramId = data.diagram_id;
        displayAnalysis(data.analysis, data.filename);

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayAnalysis(analysis, filename) {
    // Update header
    document.getElementById('diagramName').textContent = analysis.diagram_name || 'Unknown Diagram';
    document.getElementById('subjectBadge').textContent = analysis.subject || 'Not Determined';
    document.getElementById('chapterBadge').textContent = analysis.chapter || 'Not Determined';

    // Display image - use the image_base64 from the server
    const uploadedImage = document.getElementById('uploadedImage');
    
    // Fetch actual image from server
    if (currentDiagramId) {
        fetch(`/api/diagram/${currentDiagramId}`)
            .then(r => r.json())
            .then(data => {
                if (data.image_base64) {
                    uploadedImage.src = `data:image/jpeg;base64,${data.image_base64}`;
                } else {
                    console.log('No image_base64 in response');
                }
            })
            .catch(err => console.log('Could not fetch image:', err));
    }

    // Update quick revision
    document.getElementById('quickRevision').textContent = analysis.quick_revision || 'See detailed analysis for revision points.';

    // Display components
    displayComponents(analysis.components || []);

    // Display confusion points
    displayConfusions(analysis.common_confusions || []);

    // Display high yield points
    displayHighYieldPoints(analysis.high_yield_points || []);

    // Display MCQs
    displayMCQs(analysis.mcqs || []);

    // Display assertion-reason questions
    displayAssertionReasons(analysis.assertion_reason_questions || []);

    // Display match following
    displayMatchFollowing(analysis.match_following || []);

    // Display one-word questions
    displayOneWordQuestions(analysis.one_word_questions || []);

    // Display flashcards
    displayFlashcards(analysis.components || []);

    // Show analysis section
    analysisSection.style.display = 'block';
    uploadArea.style.display = 'none';
    document.getElementById('supportedDiagrams').style.display = 'none';

    // Setup export and new analysis buttons
    exportPdfBtn.onclick = () => exportToPDF();
    newAnalysisBtn.onclick = () => resetAnalysis();

    // Scroll to analysis
    setTimeout(() => {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function displayComponents(components) {
    const componentsList = document.getElementById('componentsList');
    componentsList.innerHTML = '';

    if (components.length === 0) {
        componentsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No components detected.</p>';
        return;
    }

    components.forEach((comp, index) => {
        const card = document.createElement('div');
        card.className = 'component-card';
        card.innerHTML = `
            <h4>${index + 1}. ${comp.name || 'Component'}</h4>
            <p><strong>Function:</strong> ${comp.function || 'N/A'}</p>
            <p><strong>Explanation:</strong> ${comp.detailed_explanation || 'N/A'}</p>
            <p><strong>Memory Trick:</strong> ${comp.memory_trick || 'N/A'}</p>
            <p><strong>Exam Importance:</strong> ${comp.exam_importance || 'N/A'}</p>
        `;
        componentsList.appendChild(card);
    });
}

function displayConfusions(confusions) {
    const confusionList = document.getElementById('confusionList');
    confusionList.innerHTML = '';

    if (confusions.length === 0) {
        confusionList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No common confusions identified.</p>';
        return;
    }

    confusions.forEach((conf, index) => {
        const card = document.createElement('div');
        card.className = 'confusion-card';
        card.innerHTML = `
            <h4>${index + 1}. ${conf.pair || 'Comparison'}</h4>
            <p>${conf.difference || 'See details for explanation'}</p>
        `;
        confusionList.appendChild(card);
    });
}

function displayHighYieldPoints(points) {
    const hypList = document.getElementById('hypList');
    hypList.innerHTML = '';

    if (points.length === 0) {
        hypList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No high yield points available.</p>';
        return;
    }

    points.forEach((point, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h4>Point ${index + 1}</h4>
            <p>${point}</p>
        `;
        hypList.appendChild(card);
    });
}

function displayMCQs(mcqs) {
    const mcqList = document.getElementById('mcqList');
    mcqList.innerHTML = '';

    if (mcqs.length === 0) {
        mcqList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No MCQs generated.</p>';
        return;
    }

    mcqs.forEach((mcq, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h4>MCQ ${index + 1}</h4>
            <p><strong>Q:</strong> ${mcq.question || 'Question'}</p>
            <p><strong>Options:</strong></p>
            <div style="margin-left: 1rem;">
                ${(mcq.options || []).map((opt, i) => `<p>${String.fromCharCode(65 + i)}. ${opt}</p>`).join('')}
            </div>
            <p><strong>Answer:</strong> ${mcq.correct_answer || 'N/A'}</p>
            <p><strong>Explanation:</strong> ${mcq.explanation || 'N/A'}</p>
        `;
        mcqList.appendChild(card);
    });
}

function displayAssertionReasons(questions) {
    const assertionList = document.getElementById('assertionList');
    assertionList.innerHTML = '';

    if (questions.length === 0) {
        assertionList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No assertion-reason questions generated.</p>';
        return;
    }

    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h4>Assertion-Reason ${index + 1}</h4>
            <p><strong>Assertion:</strong> ${q.assertion || 'Statement'}</p>
            <p><strong>Reason:</strong> ${q.reason || 'Reason'}</p>
            <p><strong>Correct Option:</strong> ${q.correct_option || 'N/A'}</p>
        `;
        assertionList.appendChild(card);
    });
}

function displayMatchFollowing(matches) {
    const matchList = document.getElementById('matchList');
    matchList.innerHTML = '';

    if (matches.length === 0) {
        matchList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No match following questions generated.</p>';
        return;
    }

    matches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h4>Match ${index + 1}</h4>
            <p><strong>Left:</strong> ${match.left || 'Item'}</p>
            <p><strong>Right:</strong> ${match.right || 'Match'}</p>
            <p><strong>Explanation:</strong> ${match.explanation || 'N/A'}</p>
        `;
        matchList.appendChild(card);
    });
}

function displayOneWordQuestions(questions) {
    const onewordList = document.getElementById('onewordList');
    onewordList.innerHTML = '';

    if (questions.length === 0) {
        onewordList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No one-word questions generated.</p>';
        return;
    }

    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h4>Q${index + 1}</h4>
            <p><strong>Question:</strong> ${q.question || 'Question'}</p>
            <p><strong>Answer:</strong> ${q.answer || 'Answer'}</p>
        `;
        onewordList.appendChild(card);
    });
}

function displayFlashcards(components) {
    const flashcardList = document.getElementById('flashcardList');
    flashcardList.innerHTML = '';

    if (components.length === 0) {
        flashcardList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light-secondary);">No flashcards available.</p>';
        return;
    }

    components.forEach((comp, index) => {
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `<h4>${comp.name || 'Card'}</h4>`;
        card.onclick = function() {
            if (this.classList.contains('flipped')) {
                this.innerHTML = `<h4>${comp.name || 'Card'}</h4>`;
                this.classList.remove('flipped');
            } else {
                this.innerHTML = `<p>${comp.detailed_explanation || comp.function || 'Details'}</p>`;
                this.classList.add('flipped');
            }
        };
        flashcardList.appendChild(card);
    });
}

function setupTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected button and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function exportToPDF() {
    if (!currentDiagramId) {
        showError('No diagram selected');
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(`/api/diagram/${currentDiagramId}/export-pdf`);
        
        if (!response.ok) {
            throw new Error('Failed to export PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram_analysis_${currentDiagramId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        showError('Failed to export PDF: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function resetAnalysis() {
    currentDiagramId = null;
    analysisSection.style.display = 'none';
    uploadArea.style.display = 'block';
    document.getElementById('supportedDiagrams').style.display = 'block';
    fileInput.value = '';
    uploadArea.classList.remove('dragover');
    
    // Reset tabs
    switchTab('components');
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
}

function hideError() {
    errorAlert.style.display = 'none';
}

function closeError() {
    hideError();
}

function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');
    if (successMessage && successAlert) {
        successMessage.textContent = message;
        successAlert.style.display = 'flex';
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }
}

function closeSuccess() {
    const successAlert = document.getElementById('successAlert');
    if (successAlert) {
        successAlert.style.display = 'none';
    }
}

function showInfo(message) {
    const infoAlert = document.getElementById('infoAlert');
    const infoMessage = document.getElementById('infoMessage');
    if (infoMessage && infoAlert) {
        infoMessage.textContent = message;
        infoAlert.style.display = 'flex';
    }
}

function closeInfo() {
    const infoAlert = document.getElementById('infoAlert');
    if (infoAlert) {
        infoAlert.style.display = 'none';
    }
}

// Setup theme
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}
