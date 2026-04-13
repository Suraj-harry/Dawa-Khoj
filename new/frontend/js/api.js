// API Configuration and Helper Functions

const API_BASE_URL = 'http://localhost:5000/api';

class MedicineAPI {
    /**
     * Search medicines by query
     */
    static async searchMedicines(query, limit = 10) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching medicines:', error);
            throw error;
        }
    }

    /**
     * Get alternatives for a specific medicine
     */
    static async getAlternatives(medicineName, limit = 10) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/alternatives/${encodeURIComponent(medicineName)}?limit=${limit}`
            );

            if (!response.ok) {
                throw new Error('Failed to get alternatives');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting alternatives:', error);
            throw error;
        }
    }

    /**
     * Get popular medicines
     */
    static async getPopularMedicines(limit = 20) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/popular?limit=${limit}`
            );

            if (!response.ok) {
                throw new Error('Failed to get popular medicines');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting popular medicines:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);

            if (!response.ok) {
                throw new Error('Failed to get stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}
