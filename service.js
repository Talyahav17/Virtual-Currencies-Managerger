/**
 * Service object for handling API calls to CoinGecko
 * @global
 */
const service = {
    /**
     * Fetches data with timeout and retry logic
     * @param {string} url - The URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        const timeout = options.timeout || 5000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    },

    /**
     * Gets the current exchange rate between two currencies
     * @param {string} fromSymbol - The source currency symbol (e.g., 'BTC', 'ETH')
     * @param {string} toSymbol - The target currency symbol (e.g., 'USD')
     * @returns {Promise<number>} A promise that resolves to the exchange rate
     */
    getRate: async function(fromSymbol, toSymbol) {
        // Only support USD as the target currency for CoinGecko
        if (toSymbol !== 'USD') {
            throw new Error(`CoinGecko API only supports USD as the target currency. No rate for ${fromSymbol}/${toSymbol}`);
        }
        const id = this.symbolToId[fromSymbol];
        if (!id) {
            throw new Error(`Symbol ${fromSymbol} not supported by CoinGecko.`);
        }
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
            const response = await this.fetchWithRetry(url, { timeout: 7000 });
            const data = await response.json();
            if (data && data[id] && data[id].usd) {
                const rate = parseFloat(data[id].usd);
                if (rate && !isNaN(rate)) {
                    return rate;
                }
            }
        } catch (e) {}
        throw new Error(`Failed to fetch rate for ${fromSymbol}/USD from CoinGecko.`);
    },

    /**
     * Gets the current holdings for all supported currencies
     * @returns {Promise<Object>} A promise that resolves to an object with currency holdings
     */
    async getHoldings() {
        const symbols = Object.keys(this.symbolToId);
        let rates = {};

        // Use cache if not expired
        const now = Date.now();
        if (this.rateCache && (now - this.rateCacheTimestamp) < this.cacheDuration) {
            rates = this.rateCache;
        } else {
            try {
                // Process symbols in batches to avoid rate limiting
                for (let i = 0; i < symbols.length; i += this.batchSize) {
                    const batchSymbols = symbols.slice(i, i + this.batchSize);
                    const batchIds = batchSymbols.map(s => this.symbolToId[s]).join(',');
                    
                    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${batchIds}&vs_currencies=usd`;
                    const response = await this.fetchWithRetry(url, { timeout: 5000 });
                    const data = await response.json();
                    
                    // Process and validate rates for this batch
                    for (const symbol of batchSymbols) {
                        const id = this.symbolToId[symbol];
                        if (data[id] && typeof data[id].usd === 'number' && !isNaN(data[id].usd)) {
                            rates[symbol] = data[id].usd;
                        }
                    }
                    
                    // Add a small delay between batches to avoid rate limiting
                    if (i + this.batchSize < symbols.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                
                // Save to cache
                this.rateCache = rates;
                this.rateCacheTimestamp = now;
            } catch (error) {
                console.error('Error fetching rates:', error);
                // Use cached rates if available, even if expired
                if (this.rateCache) {
                    rates = this.rateCache;
                }
            }
        }

        // Process holdings in parallel with rate limiting
        const holdings = {};
        const holdingsPromises = symbols.map(async (symbol) => {
            const amount = await dao.getAmount(symbol);
            if (amount > 0 && rates[symbol]) {
                holdings[symbol] = {
                    amount: amount,
                    value: amount * rates[symbol]
                };
            }
        });

        await Promise.all(holdingsPromises);
        return holdings;
    },

    // Cache configuration
    cacheDuration: 300000, // 5 minutes cache (increased from 1 minute)
    rateCache: null,
    rateCacheTimestamp: null,
    
    // Batch processing for multiple currencies
    batchSize: 5, // Process currencies in batches of 5
    
    // Symbol to CoinGecko ID mapping
    symbolToId: {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'ADA': 'cardano',
        'XRP': 'ripple',
        'DOT': 'polkadot',
        'DOGE': 'dogecoin'
    },
};

async function handleAdd() {
    const symbol = document.getElementById('currencySelect').value;
    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }

    try {
        dao.add(symbol, amount);
        amountInput.value = ''; // Clear the input
        await updateUI(); // <-- Ensure this is awaited
    } catch (error) {
        console.error('Error adding currency:', error);
        alert('Error adding currency. Please try again.');
    }
}

async function handleRemove() {
    const symbol = document.getElementById('currencySelect').value;
    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }

    try {
        dao.remove(symbol, amount);
        amountInput.value = ''; // Clear the input
        await updateUI(); // <-- Ensure this is awaited
    } catch (error) {
        console.error('Error removing currency:', error);
        alert('Error removing currency. Please try again.');
    }
}

function setButtonsDisabled(disabled) {
    document.getElementById('addBtn').disabled = disabled;
    document.getElementById('removeBtn').disabled = disabled;
}

function updatePortfolioChart(holdings) {
    const labels = [];
    const values = [];
    let totalValue = 0;

    for (const [symbol, data] of Object.entries(holdings)) {
        if (typeof data.value === 'number' && data.value > 0) {
            labels.push(symbol);
            values.push(data.value);
            totalValue += data.value;
        }
    }

    // Rest of the function code...
} 