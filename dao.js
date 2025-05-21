/**
 * Data Access Object for managing virtual currency holdings in local storage
 * @global
 */
const dao = {
    /**
     * Adds the specified amount to the given currency in local storage
     * @param {string} symbol - The currency symbol (e.g., 'BTC', 'ETH')
     * @param {number} amount - The amount to add
     */
    add: function(symbol, amount) {
        try {
            // Get current amount from localStorage
            let currentAmount = localStorage.getItem(symbol);
            // Convert to number, defaulting to 0 if null or invalid
            currentAmount = currentAmount ? parseFloat(currentAmount) : 0;
            
            // Add new amount to current amount
            const newAmount = currentAmount + amount;
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            console.log(`Added ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
            
            // Verify the storage
            const storedAmount = parseFloat(localStorage.getItem(symbol));
            if (storedAmount !== newAmount) {
                throw new Error('Storage verification failed');
            }
        } catch (error) {
            console.error('Error adding currency:', error);
            throw error;
        }
    },

    /**
     * Removes the specified amount from the given currency in local storage
     * @param {string} symbol - The currency symbol (e.g., 'BTC', 'ETH')
     * @param {number} amount - The amount to remove
     */
    remove: function(symbol, amount) {
        try {
            // Get current amount from localStorage
            let currentAmount = localStorage.getItem(symbol);
            // Convert to number, defaulting to 0 if null or invalid
            currentAmount = currentAmount ? parseFloat(currentAmount) : 0;
            
            // Calculate new amount, ensuring it doesn't go below 0
            const newAmount = Math.max(0, currentAmount - amount);
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            console.log(`Removed ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
            
            // Verify the storage
            const storedAmount = parseFloat(localStorage.getItem(symbol));
            if (storedAmount !== newAmount) {
                throw new Error('Storage verification failed');
            }
        } catch (error) {
            console.error('Error removing currency:', error);
            throw error;
        }
    },

    /**
     * Gets the current amount for a specific currency
     * @param {string} symbol - The currency symbol
     * @returns {number} The current amount
     */
    getAmount: function(symbol) {
        const amount = localStorage.getItem(symbol);
        return amount ? parseFloat(amount) : 0;
    },

    /**
     * Calculates the total value of all holdings in the specified currency
     * @param {string} currency - The target currency for the total value (e.g., 'USD')
     * @returns {Promise<number>} A promise that resolves to the total value
     */
    total: async function(currency) {
        const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE'];
        let total = 0;

        for (const symbol of symbols) {
            const amount = this.getAmount(symbol);
            if (amount > 0) {
                const rate = await service.getRate(symbol, currency);
                total += amount * rate;
            }
        }

        return total;
    }
}; 