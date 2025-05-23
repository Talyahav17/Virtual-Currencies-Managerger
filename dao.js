/**
 * Data Access Object for managing virtual currency holdings in local storage
 * @global
 */
const dao = {
    // Cache for total value calculations
    totalCache: null,
    totalCacheTimestamp: null,
    cacheDuration: 30000, // 30 seconds cache

    /**
     * Adds the specified amount to the given currency in local storage
     * @param {string} symbol - The currency symbol (e.g., 'BTC', 'ETH')
     * @param {number} amount - The amount to add
     */
    add: function(symbol, amount) {
        try {
            // Validate input
            if (!symbol || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                throw new Error('Invalid input parameters');
            }

            // Get current amount from localStorage
            let currentAmount = this.getAmount(symbol);
            
            // Calculate new amount
            const newAmount = currentAmount + amount;
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            console.log(`Added ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
            
            // Invalidate total cache
            this.totalCache = null;
            
            // Verify the storage
            const storedAmount = this.getAmount(symbol);
            if (Math.abs(storedAmount - newAmount) > 0.000001) {
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
            // Validate input
            if (!symbol || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                throw new Error('Invalid input parameters');
            }

            // Get current amount from localStorage
            let currentAmount = this.getAmount(symbol);
            
            // Calculate new amount, ensuring it doesn't go below 0
            const newAmount = Math.max(0, currentAmount - amount);
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            console.log(`Removed ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
            
            // Invalidate total cache
            this.totalCache = null;
            
            // Verify the storage
            const storedAmount = this.getAmount(symbol);
            if (Math.abs(storedAmount - newAmount) > 0.000001) {
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
        try {
            const amount = localStorage.getItem(symbol);
            return amount ? parseFloat(amount) : 0;
        } catch (error) {
            console.error('Error getting amount:', error);
            return 0;
        }
    },

    /**
     * Calculates the total value of all holdings in the specified currency
     * @param {string} currency - The target currency (e.g., 'USD')
     * @returns {Promise<number>} The total value
     */
    total: async function(currency) {
        try {
            // Check cache first
            const now = Date.now();
            if (this.totalCache && (now - this.totalCacheTimestamp) < this.cacheDuration) {
                return this.totalCache;
            }

            const holdings = await service.getHoldings();
            let total = 0;

            for (const data of Object.values(holdings)) {
                if (data.value && typeof data.value === 'number' && !isNaN(data.value)) {
                    total += data.value;
                }
            }

            // Update cache
            this.totalCache = total;
            this.totalCacheTimestamp = now;

            return total;
        } catch (error) {
            console.error('Error calculating total:', error);
            throw error;
        }
    },

    /**
     * Gets all currency amounts
     * @returns {Object} Object containing all currency amounts
     */
    getAllAmounts: function() {
        try {
            const amounts = {};
            const symbols = Object.keys(service.symbolToId);
            
            for (const symbol of symbols) {
                amounts[symbol] = this.getAmount(symbol);
            }
            
            return amounts;
        } catch (error) {
            console.error('Error getting all amounts:', error);
            return {};
        }
    }
};