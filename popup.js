// Global object to contain all functions and state
const VirtualCurrenciesApp = {
    // State
    chartInitialized: false,
    
    /**
     * Formats a number with commas and fixed decimal places
     * @param {number} num - The number to format
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted number string
     */
    formatNumber(num, decimals = 2) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * Shows or hides the loading overlay
     * @param {boolean} show - Whether to show or hide the overlay
     */
    toggleLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },

    /**
     * Updates the holdings list display
     */
    async updateHoldingsList(holdings) {
        try {
            console.log('Updating holdings list...');
            const holdingsList = document.getElementById('holdingsList');
            if (!holdingsList) {
                console.error('Holdings list element not found');
                return;
            }

            // Show loading state
            holdingsList.innerHTML = `
                <div class="list-group-item text-center">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span class="ms-2">Loading holdings...</span>
                </div>
            `;

            console.log('Got holdings:', holdings);
            
            // Clear current holdings
            holdingsList.innerHTML = '';
            
            // Currency logo URLs (using SVG format for better quality)
            const currencyLogos = {
                'BTC': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png',
                'ETH': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png',
                'BNB': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png',
                'SOL': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png',
                'ADA': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ada.png',
                'XRP': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png',
                'DOT': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/dot.png',
                'DOGE': 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/doge.png'
            };
            
            // Add each holding to the list
            for (const [symbol, data] of Object.entries(holdings)) {
                console.log(`Adding ${symbol} to list:`, data);
                const listItem = document.createElement('div');
                listItem.className = 'list-group-item';
                
                // Create a row for each holding
                const row = document.createElement('div');
                row.className = 'd-flex justify-content-between align-items-center';
                row.style.whiteSpace = 'nowrap';
                row.style.overflow = 'hidden';
                
                // Left side: Logo, Symbol and Amount
                const leftSide = document.createElement('div');
                leftSide.className = 'd-flex align-items-center';
                leftSide.style.minWidth = '0';
                leftSide.style.flex = '1';
                
                // Add logo with error handling
                const logoImg = document.createElement('img');
                logoImg.src = currencyLogos[symbol];
                logoImg.alt = `${symbol} logo`;
                logoImg.className = 'currency-logo me-2';
                logoImg.width = 24;
                logoImg.height = 24;
                logoImg.style.flexShrink = '0';
                
                // Handle image loading errors
                logoImg.onerror = function() {
                    // Fallback to a text-based icon if image fails to load
                    this.style.display = 'none';
                    const fallbackIcon = document.createElement('div');
                    fallbackIcon.className = 'currency-fallback me-2';
                    fallbackIcon.textContent = symbol.charAt(0);
                    fallbackIcon.style.flexShrink = '0';
                    this.parentNode.insertBefore(fallbackIcon, this);
                };
                
                const textContainer = document.createElement('div');
                textContainer.style.minWidth = '0';
                textContainer.style.overflow = 'hidden';
                
                const symbolSpan = document.createElement('span');
                symbolSpan.className = 'fw-bold me-2';
                symbolSpan.textContent = symbol;
                symbolSpan.style.whiteSpace = 'nowrap';
                
                const amountSpan = document.createElement('span');
                amountSpan.className = 'text-muted';
                amountSpan.textContent = `Amount: ${this.formatNumber(data.amount, 3)}`;
                amountSpan.style.whiteSpace = 'nowrap';
                
                textContainer.appendChild(symbolSpan);
                textContainer.appendChild(amountSpan);
                
                leftSide.appendChild(logoImg);
                leftSide.appendChild(textContainer);
                
                // Right side: Value
                const rightSide = document.createElement('div');
                rightSide.style.flexShrink = '0';
                rightSide.style.marginLeft = '10px';
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'fw-bold text-success';
                valueSpan.textContent = `$${this.formatNumber(data.value)}`;
                valueSpan.style.whiteSpace = 'nowrap';
                
                rightSide.appendChild(valueSpan);
                
                // Add both sides to the row
                row.appendChild(leftSide);
                row.appendChild(rightSide);
                
                // Add the row to the list item
                listItem.appendChild(row);
                holdingsList.appendChild(listItem);
            }
            
            // If no holdings, show message
            if (Object.keys(holdings).length === 0) {
                console.log('No holdings to display');
                const listItem = document.createElement('div');
                listItem.className = 'list-group-item text-center text-muted';
                listItem.textContent = 'No holdings yet';
                holdingsList.appendChild(listItem);
            }
        } catch (error) {
            console.error('Error updating holdings list:', error);
            const holdingsList = document.getElementById('holdingsList');
            if (holdingsList) {
                holdingsList.innerHTML = `
                    <div class="list-group-item text-center text-danger">
                        Error loading holdings. Please try again.
                    </div>
                `;
            }
        }
    },

    /**
     * Updates the total value display
     */
    async updateTotalValue() {
        const total = await dao.total('USD');
        document.getElementById('totalValue').textContent = `$${this.formatNumber(total)}`;
    },

    /**
     * Initializes the ApexCharts library by loading it dynamically
     * @returns {Promise<void>} A promise that resolves when the chart library is loaded
     */
    async initializeChart() {
        if (this.chartInitialized) return;
        
        try {
            // Load ApexCharts dynamically
            if (typeof ApexCharts === 'undefined') {
                const script = document.createElement('script');
                script.src = 'lib/apexcharts.min.js';
                script.async = true;
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            this.chartInitialized = true;
        } catch (error) {
            console.error('Error initializing chart:', error);
            throw error;
        }
    },

    /**
     * Updates the portfolio pie chart
     * @param {Object} holdings - The holdings data
     */
    async updatePortfolioChart(holdings) {
        try {
            const chartContainer = document.getElementById('portfolioChart');
            if (!chartContainer) {
                console.error('Chart container not found');
                return;
            }

            // Initialize chart if not already done
            await this.initializeChart();

            // Prepare chart data
            const chartData = Object.entries(holdings).map(([symbol, data]) => ({
                x: symbol,
                y: data.value
            }));

            // Calculate total value for percentages
            const totalValue = chartData.reduce((sum, item) => sum + item.y, 0);

            // Add percentage labels
            const chartDataWithLabels = chartData.map(item => ({
                ...item,
                label: `${item.x}: ${this.formatNumber((item.y / totalValue) * 100, 1)}%`
            }));

            // Create or update chart
            if (chartContainer.chart) {
                chartContainer.chart.updateSeries([{
                    data: chartDataWithLabels
                }]);
            } else {
                // Create new chart
                const options = {
                    series: [{
                        data: chartDataWithLabels
                    }],
                    chart: {
                        type: 'pie',
                        height: 300,
                        background: 'transparent'
                    },
                    theme: {
                        mode: document.documentElement.getAttribute('data-bs-theme') || 'light'
                    },
                    labels: chartDataWithLabels.map(item => item.label),
                    legend: {
                        position: 'bottom',
                        labels: {
                            colors: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#fff' : '#000'
                        }
                    },
                    tooltip: {
                        y: {
                            formatter: function(value) {
                                return `$${value.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`;
                            }
                        }
                    },
                    colors: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    responsive: [{
                        breakpoint: 480,
                        options: {
                            chart: {
                                height: 250
                            },
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }]
                };

                try {
                    chartContainer.chart = new ApexCharts(chartContainer, options);
                    chartContainer.chart.render();
                } catch (chartError) {
                    console.error('Error creating chart:', chartError);
                    this.showChartError(chartContainer, 'Failed to create chart');
                }
            }
        } catch (error) {
            console.error('Error updating portfolio chart:', error);
            const chartContainer = document.getElementById('portfolioChart');
            if (chartContainer) {
                this.showChartError(chartContainer, 'Failed to load chart');
            }
        }
    },

    /**
     * Shows an error message in the chart container
     * @param {HTMLElement} container - The chart container
     * @param {string} message - The error message
     */
    showChartError(container, message) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-graph-down fs-1"></i>
                <p class="mt-2">${message}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="VirtualCurrenciesApp.updateUI()">
                    Try Again
                </button>
            </div>
        `;
    },

    /**
     * Updates the entire UI with current data
     */
    async updateUI() {
        try {
            this.toggleLoading(true);
            
            // Get current holdings
            const holdings = await service.getHoldings();
            console.log('Current holdings:', holdings);
            
            // Update all UI components
            await Promise.all([
                this.updateHoldingsList(holdings),
                this.updateTotalValue(),
                this.updatePortfolioChart(holdings)
            ]);
            
            console.log('UI update completed');
        } catch (error) {
            console.error('Error updating UI:', error);
        } finally {
            this.toggleLoading(false);
        }
    },

    /**
     * Handles adding new currency holdings
     */
    async handleAdd() {
        const symbol = document.getElementById('currencySymbol').value.toUpperCase();
        const amount = parseFloat(document.getElementById('currencyAmount').value);
        
        if (!symbol || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid currency symbol and amount');
            return;
        }
        
        try {
            this.toggleLoading(true);
            await service.addHolding(symbol, amount);
            await this.updateUI();
            
            // Clear form
            document.getElementById('currencySymbol').value = '';
            document.getElementById('currencyAmount').value = '';
            
            console.log(`Added ${amount} ${symbol}`);
        } catch (error) {
            console.error('Error adding holding:', error);
            alert('Failed to add holding. Please try again.');
        } finally {
            this.toggleLoading(false);
        }
    },

    /**
     * Handles removing currency holdings
     */
    async handleRemove() {
        const symbol = document.getElementById('removeCurrencySymbol').value.toUpperCase();
        const amount = parseFloat(document.getElementById('removeCurrencyAmount').value);
        
        if (!symbol || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid currency symbol and amount');
            return;
        }
        
        try {
            // Get current holdings to validate removal
            const currentHoldings = await service.getHoldings();
            const currentAmount = currentHoldings[symbol]?.amount || 0;
            
            if (amount > currentAmount) {
                alert(`Cannot remove more ${symbol} than you currently own. You have ${this.formatNumber(currentAmount, 3)} ${symbol}.`);
                return;
            }
            
            this.toggleLoading(true);
            await service.removeHolding(symbol, amount);
            await this.updateUI();
            
            // Clear form
            document.getElementById('removeCurrencySymbol').value = '';
            document.getElementById('removeCurrencyAmount').value = '';
            
            console.log(`Removed ${amount} ${symbol}`);
        } catch (error) {
            console.error('Error removing holding:', error);
            alert('Failed to remove holding. Please try again.');
        } finally {
            this.toggleLoading(false);
        }
    },

    /**
     * Initializes the application
     */
    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('Virtual Currencies Manager initializing...');
            
            try {
                // Set up event listeners
                document.getElementById('addForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleAdd();
                });
                
                document.getElementById('removeForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRemove();
                });
                
                // Initial UI update
                await this.updateUI();
                
                console.log('Virtual Currencies Manager initialized successfully');
            } catch (error) {
                console.error('Error initializing Virtual Currencies Manager:', error);
            }
        });
    }
};

// Initialize the application
VirtualCurrenciesApp.init(); 