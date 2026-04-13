const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const results = document.getElementById('results');
const medicinesList = document.getElementById('medicinesList');
const loading = document.getElementById('loading');

// Click to upload
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.background = 'rgba(37, 99, 235, 0.05)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.background = 'transparent';

    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
});

// File selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

async function handleFile(file) {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Upload and process
    loading.style.display = 'block';
    results.style.display = 'none';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:5000/api/ocr/prescription', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        loading.style.display = 'none';

        if (data.medicines_found && data.medicines_found.length > 0) {
            displayResults(data.medicines_found);
        } else {
            results.innerHTML = '<p>❌ No medicines found in prescription</p>';
            results.style.display = 'block';
        }
    } catch (error) {
        loading.style.display = 'none';
        alert('Error processing prescription: ' + error.message);
    }
}

function displayResults(medicines) {
    medicinesList.innerHTML = medicines.map(med => `
        <div style="padding: 1.5rem; margin-bottom: 1rem; background: white; border-radius: 0.75rem; box-shadow: var(--shadow); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="font-size: 1.1rem; color: var(--text-dark);">${med}</strong>
                <p style="color: var(--text-light); margin-top: 0.25rem; font-size: 0.9rem;">
                    Click to find cheaper alternatives →
                </p>
            </div>
            <button 
               onclick="searchMedicine('${med.replace(/'/g, "\\'")}')"
               style="background: var(--primary-color); color: white; padding: 0.75rem 1.5rem; border-radius: 50px; border: none; font-weight: 600; cursor: pointer; transition: all 0.3s;"
               onmouseover="this.style.transform='scale(1.05)'; this.style.background='#1d4ed8'"
               onmouseout="this.style.transform='scale(1)'; this.style.background='var(--primary-color)'">
                Find Alternatives
            </button>
        </div>
    `).join('');

    results.style.display = 'block';
}

// Add this new function at the end of prescription.js
function searchMedicine(medicineName) {
    // Store medicine name in sessionStorage
    sessionStorage.setItem('searchMedicine', medicineName);
    // Navigate to home page
    window.location.href = 'index.html';
}

