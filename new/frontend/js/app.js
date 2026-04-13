// Main Application Initialization

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Medicine Alternative Finder Loaded');

    // Load and display stats
    try {
        const stats = await MedicineAPI.getStats();

        const totalMedicinesEl = document.getElementById('totalMedicines');
        const totalIngredientsEl = document.getElementById('totalIngredients');

        if (totalMedicinesEl) {
            totalMedicinesEl.textContent = stats.total_medicines.toLocaleString();
        }

        if (totalIngredientsEl) {
            totalIngredientsEl.textContent = stats.total_unique_ingredients.toLocaleString();
        }

        console.log('Stats loaded:', stats);
    } catch (error) {
        console.error('Failed to load stats:', error);
    }

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // AUTO-SEARCH FROM PRESCRIPTION PAGE
    // ========================================

    // Check if medicine name was passed from prescription page
    const medicineToSearch = sessionStorage.getItem('searchMedicine');

    if (medicineToSearch) {
        console.log('Auto-searching for:', medicineToSearch);

        // Wait for search handler to be initialized
        const waitForSearchHandler = setInterval(() => {
            if (window.searchHandler) {
                clearInterval(waitForSearchHandler);

                // Set the search input value
                const searchInput = document.getElementById('medicineSearch');
                if (searchInput) {
                    searchInput.value = medicineToSearch;

                    // Clear the stored value
                    sessionStorage.removeItem('searchMedicine');

                    // Trigger search
                    window.searchHandler.handleSearch();

                    console.log('✅ Auto-search triggered');
                }
            }
        }, 100);

        // Timeout after 3 seconds
        setTimeout(() => {
            clearInterval(waitForSearchHandler);
        }, 3000);
    }

    console.log('✅ App initialized successfully');
});
// Main Application Initialization

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Medicine Alternative Finder Loaded');

    // Load and display stats
    try {
        const stats = await MedicineAPI.getStats();

        const totalMedicinesEl = document.getElementById('totalMedicines');
        const totalIngredientsEl = document.getElementById('totalIngredients');

        if (totalMedicinesEl) {
            totalMedicinesEl.textContent = stats.total_medicines.toLocaleString();
        }

        if (totalIngredientsEl) {
            totalIngredientsEl.textContent = stats.total_unique_ingredients.toLocaleString();
        }

        console.log('Stats loaded:', stats);
    } catch (error) {
        console.error('Failed to load stats:', error);
    }

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // AUTO-SEARCH FROM PRESCRIPTION PAGE
    // ========================================

    // Check if medicine name was passed from prescription page
    const medicineToSearch = sessionStorage.getItem('searchMedicine');

    if (medicineToSearch) {
        console.log('Auto-searching for:', medicineToSearch);

        // Wait for search handler to be initialized
        const waitForSearchHandler = setInterval(() => {
            if (window.searchHandler) {
                clearInterval(waitForSearchHandler);

                // Set the search input value
                const searchInput = document.getElementById('medicineSearch');
                if (searchInput) {
                    searchInput.value = medicineToSearch;

                    // Clear the stored value
                    sessionStorage.removeItem('searchMedicine');

                    // Trigger search
                    window.searchHandler.handleSearch();

                    console.log('✅ Auto-search triggered');
                }
            }
        }, 100);

        // Timeout after 3 seconds
        setTimeout(() => {
            clearInterval(waitForSearchHandler);
        }, 3000);
    }

    console.log('✅ App initialized successfully');
});
