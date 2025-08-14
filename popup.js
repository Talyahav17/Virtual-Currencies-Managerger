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
     * Updates the portfolio pie chart
     * @param {Object} holdings - The holdings data
     */
    async updatePortfolioChart(holdings) {
        try {
            console.log('Updating portfolio chart with holdings:', holdings);
            const chartContainer = document.getElementById('portfolioChart');
            if (!chartContainer) {
                console.error('Chart container not found');
                return;
            }

            // Prepare chart data
            const chartData = Object.entries(holdings).map(([symbol, data]) => ({
                symbol: symbol,
                value: data.value
            }));

            console.log('Chart data prepared:', chartData);

            // Check if we have valid data
            if (chartData.length === 0) {
                console.log('No chart data available');
                this.showChartError(chartContainer, 'No holdings to display');
                return;
            }

            // Calculate total value for percentages
            const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
            console.log('Total value:', totalValue);

            if (totalValue <= 0) {
                console.log('Total value is 0 or negative');
                this.showChartError(chartContainer, 'No holdings with value to display');
                return;
            }

            // Create pie chart with HTML and CSS
            console.log('Creating pie chart');
            
            const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
            
            let chartHTML = `
                <div class="chart-container" style="position: relative; height: 400px; width: 100%; display: flex; align-items: center; justify-content: center;">
                    <div class="pie-chart" style="position: relative; width: 200px; height: 200px; border-radius: 50%; margin: 20px;">
            `;
            
            let currentAngle = 0;
            chartData.forEach((item, index) => {
                const percentage = (item.value / totalValue) * 100;
                const angle = (percentage / 100) * 360;
                const color = colors[index % colors.length];
                
                if (percentage > 0) {
                    chartHTML += `
                        <div class="pie-slice" style="
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            background: conic-gradient(from ${currentAngle}deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg);
                            transform: rotate(-90deg);
                        "></div>
                    `;
                    currentAngle += angle;
                }
            });
            
            chartHTML += `
                    </div>
                    <div class="chart-legend" style="margin-left: 30px; flex: 1;">
            `;
            
            chartData.forEach((item, index) => {
                const percentage = ((item.value / totalValue) * 100).toFixed(1);
                const color = colors[index % colors.length];
                
                chartHTML += `
                    <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div class="color-box" style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; margin-right: 10px; flex-shrink: 0;"></div>
                        <div class="legend-text" style="flex: 1;">
                            <strong>${item.symbol}</strong>: ${percentage}% 
                            <br><span style="color: #666; font-size: 0.9em;">$${this.formatNumber(item.value)}</span>
                        </div>
                    </div>
                `;
            });
            
            chartHTML += `
                    </div>
                </div>
            `;
            
            chartContainer.innerHTML = chartHTML;
            console.log('Pie chart created successfully');
            
        } catch (error) {
            console.error('Error updating portfolio chart:', error);
            const chartContainer = document.getElementById('portfolioChart');
            if (chartContainer) {
                this.showChartError(chartContainer, 'Failed to load chart: ' + error.message);
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
            console.log('Starting UI updates...');
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
        const symbol = document.getElementById('currencySelect').value;
        const amount = parseFloat(document.getElementById('amount').value);
        
        if (!symbol || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid currency symbol and amount');
            return;
        }
        
        try {
            this.toggleLoading(true);
            dao.add(symbol, amount);
            await this.updateUI();
            
            // Clear form
            document.getElementById('amount').value = '';
            
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
        const symbol = document.getElementById('currencySelect').value;
        const amount = parseFloat(document.getElementById('amount').value);
        
        if (!symbol || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid currency symbol and amount');
            return;
        }
        
        try {
            // Get current holdings to validate removal
            const currentAmount = dao.getAmount(symbol);
            
            if (amount > currentAmount) {
                alert(`Cannot remove more ${symbol} than you currently own. You have ${this.formatNumber(currentAmount, 3)} ${symbol}.`);
                return;
            }
            
            this.toggleLoading(true);
            dao.remove(symbol, amount);
            await this.updateUI();
            
            // Clear form
            document.getElementById('amount').value = '';
            
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
                document.getElementById('addBtn').addEventListener('click', () => {
                    this.handleAdd();
                });
                
                document.getElementById('removeBtn').addEventListener('click', () => {
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