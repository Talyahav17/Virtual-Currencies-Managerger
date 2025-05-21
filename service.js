/**
 * Service object for handling API calls to CoinGecko
 * @global
 */
const service = {
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
            const response = await fetchWithTimeout(url, { timeout: 7000 });
            if (response.ok) {
                const data = await response.json();
                if (data && data[id] && data[id].usd) {
                    const rate = parseFloat(data[id].usd);
                    if (rate && !isNaN(rate)) {
                        return rate;
                    }
                }
            }
        } catch (e) {}
        throw new Error(`Failed to fetch rate for ${fromSymbol}/USD from CoinGecko.`);
    },

    /**
     * Gets the current holdings for all supported currencies
     * @returns {Promise<Object>} A promise that resolves to an object with currency holdings
     */
    getHoldings: async function() {
        const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE'];
        const ids = symbols.map(s => this.symbolToId[s]).join(',');
        let rates = {};

        // Use cache if not expired
        const now = Date.now();
        if (this.rateCache && (now - this.rateCacheTimestamp) < this.cacheDuration) {
            rates = this.rateCache;
        } else {
            try {
                const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
                const response = await fetchWithTimeout(url, { timeout: 7000 });
                if (response.ok) {
                    const data = await response.json();
                    for (const symbol of symbols) {
                        const id = this.symbolToId[symbol];
                        if (data[id] && data[id].usd) {
                            rates[symbol] = parseFloat(data[id].usd);
                        }
                    }
                    // Save to cache
                    this.rateCache = rates;
                    this.rateCacheTimestamp = now;
                }
            } catch (e) {}
        }

        const holdings = {};
        for (const symbol of symbols) {
            const amount = dao.getAmount(symbol);
            if (amount > 0) {
                const rate = rates[symbol];
                if (rate && !isNaN(rate)) {
                    holdings[symbol] = {
                        amount: amount,
                        value: amount * rate
                    };
                } else {
                    holdings[symbol] = {
                        amount: amount,
                        value: null // Mark as unavailable
                    };
                }
            }
        }
        return holdings;
    },

    // Map currency symbols to CoinGecko IDs
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

    rateCache: null,
    rateCacheTimestamp: 0,
    cacheDuration: 120000, // 2 minutes
};

// Helper for fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 7000 } = options; // 7 seconds default
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

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