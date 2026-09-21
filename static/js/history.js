// History Page JavaScript

let allDiagrams = [];

document.addEventListener('DOMContentLoaded', function() {
    setupFilters();
    setupTheme();
});

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const subjectFilter = document.getElementById('subjectFilter');

    if (searchInput) searchInput.addEventListener('input', filterDiagrams);
    if (subjectFilter) subjectFilter.addEventListener('change', filterDiagrams);
}

function filterDiagrams() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subjectFilter = document.getElementById('subjectFilter').value;

    const cards = document.querySelectorAll('.history-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const diagramName = card.querySelector('h3').textContent.toLowerCase();
        const subject = card.querySelector('.subject-badge').textContent;
        
        const matchesSearch = diagramName.includes(searchTerm);
        const matchesSubject = !subjectFilter || subject === subjectFilter;

        if (matchesSearch && matchesSubject) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show empty message if no results
    const diagramsList = document.getElementById('diagramsList');
    if (visibleCount === 0) {
        let emptyMsg = diagramsList.querySelector('.empty-filter');
        if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-filter empty-state-large';
            emptyMsg.textContent = 'No diagrams match your search.';
            diagramsList.appendChild(emptyMsg);
        }
        emptyMsg.style.display = 'block';
    } else {
        const emptyMsg = diagramsList.querySelector('.empty-filter');
        if (emptyMsg) emptyMsg.style.display = 'none';
    }
}

async function viewDetails(diagramId) {
    try {
        const response = await fetch(`/api/diagram/${diagramId}`);
        if (!response.ok) throw new Error('Failed to fetch diagram');
        
        const diagram = await response.json();
        showModal(diagram);
    } catch (error) {
        alert('Error loading diagram details: ' + error.message);
    }
}

function showModal(diagram) {
    const modal = document.getElementById('analysisModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `${diagram.diagram_name} - ${diagram.subject}`;

    let htmlContent = `
        <div class="modal-diagram-content">
            <div class="modal-meta">
                <p><strong>Subject:</strong> ${diagram.subject}</p>
                <p><strong>Chapter:</strong> ${diagram.chapter}</p>
                <p><strong>Uploaded:</strong> ${diagram.uploaded_at}</p>
            </div>

            <div class="modal-quick-revision">
                <h3>Quick Revision</h3>
                <p>${diagram.revision_summary || 'N/A'}</p>
            </div>

            <div class="modal-analysis">
                <h3>Analysis</h3>
                <p>${diagram.analysis || 'No analysis available'}</p>
            </div>
    `;

    // Components
    if (diagram.components && diagram.components.length > 0) {
        htmlContent += '<div class="modal-section"><h3>Components</h3><div class="modal-components">';
        diagram.components.forEach((comp, i) => {
            htmlContent += `
                <div class="modal-component">
                    <h4>${i + 1}. ${comp.name}</h4>
                    <p><strong>Function:</strong> ${comp.function}</p>
                    <p><strong>Explanation:</strong> ${comp.detailed_explanation}</p>
                    <p><strong>Memory Trick:</strong> ${comp.memory_trick}</p>
                    <p><strong>Exam Importance:</strong> ${comp.exam_importance}</p>
                </div>
            `;
        });
        htmlContent += '</div></div>';
    }

    // High Yield Points
    if (diagram.high_yield_points && diagram.high_yield_points.length > 0) {
        htmlContent += '<div class="modal-section"><h3>High Yield Points</h3><ul>';
        diagram.high_yield_points.forEach(point => {
            htmlContent += `<li>${point}</li>`;
        });
        htmlContent += '</ul></div>';
    }

    // MCQs (limited to first 3)
    if (diagram.mcqs && diagram.mcqs.length > 0) {
        htmlContent += '<div class="modal-section"><h3>MCQ Questions (Showing first 3)</h3>';
        diagram.mcqs.slice(0, 3).forEach((mcq, i) => {
            htmlContent += `
                <div class="modal-question">
                    <p><strong>Q${i + 1}:</strong> ${mcq.question}</p>
                    <div style="margin-left: 1rem;">
                        ${(mcq.options || []).map((opt, j) => `<p>${String.fromCharCode(65 + j)}. ${opt}</p>`).join('')}
                    </div>
                    <p><strong>Answer:</strong> ${mcq.correct_answer}</p>
                </div>
            `;
        });
        htmlContent += '</div>';
    }

    htmlContent += '</div>';

    modalBody.innerHTML = htmlContent;
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('analysisModal');
    modal.style.display = 'none';
}

async function exportPdf(diagramId) {
    try {
        const response = await fetch(`/api/diagram/${diagramId}/export-pdf`);
        if (!response.ok) throw new Error('Failed to export PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram_analysis_${diagramId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert('Error exporting PDF: ' + error.message);
    }
}

async function deleteDiagram(diagramId) {
    if (!confirm('Are you sure you want to delete this diagram? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/diagram/${diagramId}/delete`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete diagram');

        // Reload page
        window.location.reload();
    } catch (error) {
        alert('Error deleting diagram: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('analysisModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

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

// Add some CSS for modal content
const style = document.createElement('style');
style.textContent = `
.modal-diagram-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.modal-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-light-tertiary);
    border-radius: 0.5rem;
}

.modal-meta p {
    margin: 0;
    font-size: 0.9rem;
}

.modal-quick-revision,
.modal-analysis {
    padding: 1rem;
    background-color: var(--bg-light-tertiary);
    border-radius: 0.5rem;
}

.modal-quick-revision h3,
.modal-analysis h3 {
    margin-top: 0;
    color: var(--color-primary);
}

.modal-section {
    padding: 1rem;
    border-left: 4px solid var(--color-primary);
    background-color: var(--bg-light-tertiary);
    border-radius: 0.5rem;
}

.modal-section h3 {
    margin-top: 0;
    color: var(--color-primary);
}

.modal-section ul {
    margin: 0;
    padding-left: 1.5rem;
}

.modal-section li {
    margin-bottom: 0.5rem;
}

.modal-components {
    display: grid;
    gap: 1rem;
}

.modal-component {
    padding: 1rem;
    border: 1px solid var(--border-light);
    border-radius: 0.5rem;
    background-color: var(--bg-light);
}

.modal-component h4 {
    margin-top: 0;
    color: var(--color-primary);
}

.modal-component p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.modal-question {
    padding: 1rem;
    border: 1px solid var(--border-light);
    border-radius: 0.5rem;
    background-color: var(--bg-light);
    margin-bottom: 1rem;
}

.modal-question p {
    margin: 0.5rem 0;
}

.modal-question strong {
    color: var(--color-primary);
}
`;
document.head.appendChild(style);
