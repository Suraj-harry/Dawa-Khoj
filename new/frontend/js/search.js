// Search and Autocomplete Functionality

class SearchHandler {
    constructor() {
        this.searchInput = document.getElementById('medicineSearch');
        this.searchBtn = document.getElementById('searchBtn');
        this.autocomplete = document.getElementById('autocomplete');
        this.resultsSection = document.getElementById('resultsSection');

        this.debounceTimer = null;
        this.selectedMedicine = null;

        // Only initialize if elements exist
        if (this.searchInput && this.searchBtn) {
            this.init();
        } else {
            console.error('Search elements not found!');
        }
    }

    init() {
        // Search button click
        this.searchBtn.addEventListener('click', () => this.handleSearch());

        // Enter key press
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Autocomplete on input
        this.searchInput.addEventListener('input', (e) => {
            this.handleAutocomplete(e.target.value);
        });

        // Click outside to close autocomplete
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) &&
                !this.autocomplete.contains(e.target)) {
                this.hideAutocomplete();
            }
        });
    }

    handleAutocomplete(query) {
        clearTimeout(this.debounceTimer);

        if (query.length < 2) {
            this.hideAutocomplete();
            return;
        }

        this.debounceTimer = setTimeout(async () => {
            try {
                const data = await MedicineAPI.searchMedicines(query, 5);
                this.showAutocomplete(data.results);
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        }, 300);
    }

    showAutocomplete(results) {
        if (!results || results.length === 0) {
            this.hideAutocomplete();
            return;
        }

        this.autocomplete.innerHTML = results.map(med => `
            <div class="suggestion-item" data-name="${this.escapeHtml(med.name)}">
                <div class="suggestion-name">${this.escapeHtml(med.name)}</div>
                <div class="suggestion-ingredient">${this.escapeHtml(med.active_ingredient)}</div>
            </div>
        `).join('');

        // Add click handlers
        this.autocomplete.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                this.selectMedicine(name);
            });
        });

        this.autocomplete.classList.add('active');
    }

    hideAutocomplete() {
        if (this.autocomplete) {
            this.autocomplete.classList.remove('active');
        }
    }

    selectMedicine(medicineName) {
        this.searchInput.value = medicineName;
        this.hideAutocomplete();
        this.handleSearch();
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();

        if (!query) {
            alert('Please enter a medicine name');
            return;
        }

        this.showLoading();

        try {
            console.log('Searching for:', query);

            // Search for the medicine
            const searchData = await MedicineAPI.searchMedicines(query, 1);
            console.log('Search results:', searchData);

            if (!searchData || !searchData.results || searchData.results.length === 0) {
                this.showNoResults();
                return;
            }

            const medicine = searchData.results[0];
            console.log('Found:', medicine.name);

            // Get alternatives
            const altData = await MedicineAPI.getAlternatives(medicine.name);
            console.log('Alternatives:', altData);

            if (!altData || altData.error || !altData.original) {
                this.showNoResults();
                return;
            }

            // Display results
            this.displayResults(altData);

        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        }
    }

    showLoading() {
        if (!this.resultsSection) return;

        // Build the HTML structure
        const html = `
            <div class="container">
                <div class="medicine-card original" id="originalMedicine">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p style="margin-top: 1rem;">Searching for alternatives...</p>
                    </div>
                </div>
                <div id="alternatives" style="display: none;">
                    <h3>💰 Cheaper Alternatives</h3>
                    <div id="alternativesList" class="alternatives-grid"></div>
                </div>
                <div id="noResults" class="no-results" style="display: none;"></div>
            </div>
        `;

        this.resultsSection.innerHTML = html;
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayResults(data) {
        if (!this.resultsSection) return;

        const { original, alternatives } = data;

        // Build the complete HTML
        const html = `
            <div class="container">
                <!-- Original Medicine -->
                <div class="medicine-card original">
                    <div class="medicine-header">
                        <div>
                            <div class="medicine-name">${this.escapeHtml(original.name)}</div>
                            <div class="medicine-ingredient">
                                🧪 Active Ingredient: ${this.escapeHtml(original.active_ingredient)}
                            </div>
                        </div>
                        <div class="medicine-price">₹${parseFloat(original.price).toFixed(2)}</div>
                    </div>
                    <div class="medicine-meta">
                        <span>📦 Type: ${this.escapeHtml(original.type)}</span>
                        <span>🏭 ${this.escapeHtml(original.manufacturer)}</span>
                    </div>
                </div>

                <!-- Alternatives -->
                ${alternatives && alternatives.length > 0 ? `
                    <div id="alternatives">
                        <h3>💰 Cheaper Alternatives (${alternatives.length} found)</h3>
                        <div class="alternatives-grid">
                            ${alternatives.map(alt => {
            const savings = parseFloat(alt.savings || 0);
            const savingsPercent = parseFloat(alt.savings_percent || 0);

            return `
                                    <div class="alternative-card">
                                        ${savings > 0 ? `
                                            <div class="savings-badge">
                                                Save ₹${savings.toFixed(2)}
                                            </div>
                                        ` : `
                                            <div class="savings-badge negative">
                                                +₹${Math.abs(savings).toFixed(2)}
                                            </div>
                                        `}
                                        <div class="medicine-name">${this.escapeHtml(alt.name)}</div>
                                        <div class="medicine-price">₹${parseFloat(alt.price).toFixed(2)}</div>
                                        <div class="medicine-meta">
                                            <span>🏭 ${this.escapeHtml(alt.manufacturer)}</span>
                                        </div>
                                        ${savings > 0 ? `
                                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); color: var(--secondary-color); font-weight: 600; font-size: 1.1rem;">
                                                💰 ${savingsPercent.toFixed(1)}% cheaper
                                            </div>
                                        ` : ''}
                                        <button 
                                            onclick="checkPharmacyAvailability('${this.escapeHtml(alt.name).replace(/'/g, "\\'")}')"
                                            style="width: 100%; margin-top: 1rem; background: var(--secondary-color); color: white; padding: 0.75rem; border: none; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                                            onmouseover="this.style.transform='scale(1.05)'"
                                            onmouseout="this.style.transform='scale(1)'">
                                            📍 Check Pharmacy Availability
                                        </button>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="no-results">
                        <p>😕 No alternatives found for this medicine.</p>
                    </div>
                `}
            </div>
        `;

        this.resultsSection.innerHTML = html;
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    showNoResults() {
        if (!this.resultsSection) return;

        this.resultsSection.innerHTML = `
            <div class="container">
                <div class="no-results">
                    <p>😕 Medicine not found in our database.</p>
                    <p>Please try searching with a different name.</p>
                </div>
            </div>
        `;
        this.resultsSection.style.display = 'block';
    }

    showError(message) {
        if (!this.resultsSection) return;

        this.resultsSection.innerHTML = `
            <div class="container">
                <div class="no-results">
                    <p>❌ Error: ${this.escapeHtml(message)}</p>
                    <p>Please try again.</p>
                </div>
            </div>
        `;
        this.resultsSection.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Global function for pharmacy availability check
window.checkPharmacyAvailability = function (medicineName) {
    // Store medicine name and redirect to pharmacy page
    sessionStorage.setItem('checkMedicine', medicineName);
    window.location.href = 'pharmacy.html';
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchHandler = new SearchHandler();
    });
} else {
    window.searchHandler = new SearchHandler();
}
