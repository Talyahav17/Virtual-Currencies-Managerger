/**
 * Data Access Object for managing virtual currency holdings in local storage
 * @global
 */
const dao = {
    // Cache for total value calculations
    totalCache: null,
    totalCacheTimestamp: null,
    cacheDuration: 300000, // 5 minutes cache (increased from 30 seconds)
    
    // Cache for individual currency amounts
    amountCache: new Map(),
    amountCacheTimestamp: null,

    /**
     * Gets the amount for a specific currency
     * @param {string} symbol - The currency symbol
     * @returns {number} The amount of the currency
     */
    getAmount: function(symbol) {
        // Check cache first
        if (this.amountCache.has(symbol)) {
            return this.amountCache.get(symbol);
        }

        const amount = parseFloat(localStorage.getItem(symbol)) || 0;
        this.amountCache.set(symbol, amount);
        return amount;
    },

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

            // Get current amount from cache or storage
            let currentAmount = this.getAmount(symbol);
            
            // Calculate new amount
            const newAmount = currentAmount + amount;
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            
            // Update cache
            this.amountCache.set(symbol, newAmount);
            
            // Invalidate total cache
            this.totalCache = null;
            
            console.log(`Added ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
        } catch (error) {
            console.error('Error adding currency:', error);
            throw error;
        }
    },

    /**
     * Removes the specified amount from the given currency in local storage
     * @param {string} symbol - The currency symbol
     * @param {number} amount - The amount to remove
     */
    remove: function(symbol, amount) {
        try {
            // Validate input
            if (!symbol || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
                throw new Error('Invalid input parameters');
            }

            // Get current amount from cache or storage
            let currentAmount = this.getAmount(symbol);
            
            // Calculate new amount
            const newAmount = Math.max(0, currentAmount - amount);
            
            // Store the updated amount
            localStorage.setItem(symbol, newAmount.toString());
            
            // Update cache
            this.amountCache.set(symbol, newAmount);
            
            // Invalidate total cache
            this.totalCache = null;
            
            console.log(`Removed ${amount} ${symbol}. Previous: ${currentAmount}, New total: ${newAmount}`);
        } catch (error) {
            console.error('Error removing currency:', error);
            throw error;
        }
    },

    /**
     * Clears all currency data from storage
     */
    clear: function() {
        try {
            // Clear localStorage
            Object.keys(this.symbolToId).forEach(symbol => {
                localStorage.removeItem(symbol);
            });
            
            // Clear caches
            this.amountCache.clear();
            this.totalCache = null;
            
            console.log('All currency data cleared');
        } catch (error) {
            console.error('Error clearing currency data:', error);
            throw error;
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