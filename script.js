const analyzeBtn = document.getElementById('analyzeBtn');
const syllabusInput = document.getElementById('syllabusUpload');
const gradebookInput = document.getElementById('gradebookUpload');

let state = { syllabusText: "", gradebookText: "", weights: {}, grades: {} };

// Enable button only when both files are uploaded
[syllabusInput, gradebookInput].forEach(input => {
    input.addEventListener('change', () => {
        analyzeBtn.disabled = !(syllabusInput.files[0] && gradebookInput.files[0]);
    });
});

analyzeBtn.addEventListener('click', async () => {
    document.getElementById('loading').classList.remove('hidden');
    
    // Perform OCR on both images
    state.syllabusText = await performOCR(syllabusInput.files[0]);
    state.gradebookText = await performOCR(gradebookInput.files[0]);

    processData();
});

async function performOCR(file) {
    const worker = await Tesseract.createWorker('eng');
    const ret = await worker.recognize(file);
    await worker.terminate();
    return ret.data.text;
}

function processData() {
    const syllabusLines = state.syllabusText.split('\n');
    const gradebookLines = state.gradebookText.split('\n');

    // 1. Extract Weights (Looking for "Category ... 30%")
    const weightRegex = /([a-zA-Z\s]+).+?(\d+)%/;
    syllabusLines.forEach(line => {
        const match = line.match(weightRegex);
        if (match) {
            const cat = normalizeCategory(match[1]);
            state.weights[cat] = parseFloat(match[2]) / 100;
        }
    });

    // 2. Extract Grades (Looking for "Score / Total")
    const gradeRegex = /(\d+)\s*\/\s*(\d+)/;
    gradebookLines.forEach(line => {
        const match = line.match(gradeRegex);
        if (match) {
            const score = parseFloat(match[1]);
            const total = parseFloat(match[2]);
            const percent = (score / total) * 100;
            
            // Basic Keyword matching for category
            const cat = detectCategory(line, Object.keys(state.weights));
            if (!state.grades[cat]) state.grades[cat] = [];
            state.grades[cat].push(percent);
        }
    });

    displayResults();
}

function normalizeCategory(text) {
    text = text.toLowerCase().trim();
    if (text.includes("quiz")) return "quizzes";
    if (text.includes("exam") || text.includes("test")) return "exams";
    if (text.includes("hw") || text.includes("home")) return "homework";
    return text;
}

function detectCategory(line, categories) {
    line = line.toLowerCase();
    for (let cat of categories) {
        if (line.includes(cat)) return cat;
    }
    return "other";
}

function displayResults() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    
    let totalGrade = 0;
    let totalWeight = 0;

    for (let cat in state.weights) {
        if (state.grades[cat]) {
            const avg = state.grades[cat].reduce((a, b) => a + b, 0) / state.grades[cat].length;
            totalGrade += avg * state.weights[cat];
            totalWeight += state.weights[cat];
        }
    }

    const final = totalWeight > 0 ? (totalGrade / totalWeight).toFixed(2) : 0;
    document.getElementById('finalGradeDisplay').innerText = `Final Calculated Grade: ${final}%`;
}

// Function to add a row (can be called manually OR by OCR)
function addRow(category = "", weight = "", score = "") {
    const row = document.createElement('div');
    row.className = 'grade-row';

    row.innerHTML = `
        <input type="text" placeholder="Category" class="cat-name" value="${category}">
        <input type="number" placeholder="Weight %" class="weight-input" value="${weight}">
        <input type="number" placeholder="Score %" class="score-input" value="${score}">
        <button class="remove-btn">✕</button>
    `;

    row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    document.getElementById('grade-rows-container').appendChild(row);
}

// Modify the OCR processing function to fill the rows instead of calculating
function processData() {
    // ... (Your existing OCR logic to get weights and grades) ...

    // Clear existing rows first (optional)
    document.getElementById('grade-rows-container').innerHTML = '';

    // Loop through detected weights and create a row for each
    for (let cat in state.weights) {
        const detectedWeight = (state.weights[cat] * 100).toFixed(0);
        const detectedScore = state.grades[cat] ? (state.grades[cat][0]).toFixed(0) : "";
        
        // This AUTO-FILLS the boxes but doesn't calculate yet
        addRow(cat, detectedWeight, detectedScore);
    }
    
    document.getElementById('loading').classList.add('hidden');
}

// Final calculation happens ONLY when they click the calculate button
document.getElementById('calculateBtn').addEventListener('click', () => {
    const weights = document.querySelectorAll('.weight-input');
    const scores = document.querySelectorAll('.score-input');
    
    let totalGrade = 0;
    let totalWeight = 0;

    for (let i = 0; i < weights.length; i++) {
        const w = parseFloat(weights[i].value) || 0;
        const s = parseFloat(scores[i].value) || 0;
        totalGrade += (w * (s / 100));
        totalWeight += w;
    }

    document.getElementById('resultDisplay').innerText = (totalGrade).toFixed(2) + "%";
});