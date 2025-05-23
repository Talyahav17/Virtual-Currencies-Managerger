/**
 * Formats a number with commas and fixed decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Shows or hides the loading overlay
 * @param {boolean} show - Whether to show or hide the overlay
 */
function toggleLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Updates the holdings list display
 */
async function updateHoldingsList(holdings) {
    try {
        const holdingsList = document.getElementById('holdingsList');
        if (!holdingsList) {
            console.error('Holdings list element not found');
            return;
        }

        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
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

        // Preload images
        const imagePromises = Object.values(currencyLogos).map(src => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even on error to not block loading
                img.src = src;
            });
        });

        // Add each holding to the fragment
        for (const [symbol, data] of Object.entries(holdings)) {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item';
            
            // Create a row for each holding
            const row = document.createElement('div');
            row.className = 'd-flex justify-content-between align-items-center';
            
            // Left side: Logo, Symbol and Amount
            const leftSide = document.createElement('div');
            leftSide.className = 'd-flex align-items-center';
            
            // Add logo with error handling
            const logoImg = document.createElement('img');
            logoImg.src = currencyLogos[symbol];
            logoImg.alt = `${symbol} logo`;
            logoImg.className = 'currency-logo me-2';
            logoImg.width = 24;
            logoImg.height = 24;
            logoImg.loading = 'lazy'; // Add lazy loading
            
            // Handle image loading errors
            logoImg.onerror = function() {
                this.style.display = 'none';
                const fallbackIcon = document.createElement('div');
                fallbackIcon.className = 'currency-fallback me-2';
                fallbackIcon.textContent = symbol.charAt(0);
                this.parentNode.insertBefore(fallbackIcon, this);
            };
            
            const textContainer = document.createElement('div');
            const symbolSpan = document.createElement('span');
            symbolSpan.className = 'fw-bold me-2';
            symbolSpan.textContent = symbol;
            
            const amountSpan = document.createElement('span');
            amountSpan.className = 'text-muted';
            amountSpan.textContent = `Amount: ${formatNumber(data.amount, 6)}`;
            
            textContainer.appendChild(symbolSpan);
            textContainer.appendChild(amountSpan);
            
            leftSide.appendChild(logoImg);
            leftSide.appendChild(textContainer);
            
            // Right side: Value
            const rightSide = document.createElement('div');
            const valueSpan = document.createElement('span');
            valueSpan.className = 'fw-bold text-success';
            valueSpan.textContent = `$${formatNumber(data.value)}`;
            
            rightSide.appendChild(valueSpan);
            
            // Add both sides to the row
            row.appendChild(leftSide);
            row.appendChild(rightSide);
            
            // Add the row to the list item
            listItem.appendChild(row);
            fragment.appendChild(listItem);
        }
        
        // If no holdings, show message
        if (Object.keys(holdings).length === 0) {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item text-center text-muted';
            listItem.textContent = 'No holdings yet';
            fragment.appendChild(listItem);
        }

        // Clear and update the list in one operation
        holdingsList.innerHTML = '';
        holdingsList.appendChild(fragment);

        // Wait for images to load in the background
        Promise.all(imagePromises).catch(() => {
            // Ignore errors in image preloading
        });

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
}

/**
 * Updates the total value display
 */
async function updateTotalValue() {
    const total = await dao.total('USD');
    document.getElementById('totalValue').textContent = `$${formatNumber(total)}`;
}

let updateInProgress = false;

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

async function updateUI() {
    if (updateInProgress) {
        console.log('Update already in progress, skipping...');
        return;
    }

    try {
        updateInProgress = true;
        toggleLoading(true);
        
        // Get all data in parallel
        const [holdings, total] = await Promise.all([
            service.getHoldings(),
            dao.total('USD')
        ]);

        // Update total value immediately
        const totalValueElement = document.getElementById('totalValue');
        if (totalValueElement) {
            totalValueElement.textContent = `$${formatNumber(total)}`;
        }

        // Update holdings list and chart in parallel
        await Promise.all([
            updateHoldingsList(holdings),
            Object.keys(holdings).length > 0 ? updatePortfolioChart(holdings) : Promise.resolve()
        ]);
        
    } catch (error) {
        console.error('Error updating UI:', error);
        showError('Error updating data. Please try again.');
    } finally {
        updateInProgress = false;
        toggleLoading(false);
    }
}

// Debounced version of updateUI
const debouncedUpdateUI = debounce(updateUI, 300);

// Throttled version of updateUI for frequent updates
const throttledUpdateUI = throttle(updateUI, 1000);

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 150);
    }, 5000);
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
        toggleLoading(true);
        await dao.add(symbol, amount);
        amountInput.value = ''; // Clear the input
        await updateUI();
    } catch (error) {
        console.error('Error adding currency:', error);
        alert('Error adding currency. Please try again.');
    } finally {
        toggleLoading(false);
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
        toggleLoading(true);
        await dao.remove(symbol, amount);
        amountInput.value = ''; // Clear the input
        await updateUI();
    } catch (error) {
        console.error('Error removing currency:', error);
        alert('Error removing currency. Please try again.');
    } finally {
        toggleLoading(false);
    }
}

// Optimize chart initialization
let chartInitialized = false;
let chartInitPromise = null;
let chartUpdateTimeout = null;

async function downloadApexCharts() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/apexcharts@3.45.1/dist/apexcharts.min.js');
        if (!response.ok) throw new Error('Failed to download ApexCharts');
        
        const scriptContent = await response.text();
        
        // Create lib directory if it doesn't exist
        const libDir = 'lib';
        if (!await checkDirectoryExists(libDir)) {
            await createDirectory(libDir);
        }
        
        // Save the file
        await saveFile(`${libDir}/apexcharts.min.js`, scriptContent);
        console.log('ApexCharts library downloaded successfully');
        return true;
    } catch (error) {
        console.error('Error downloading ApexCharts:', error);
        return false;
    }
}

async function checkDirectoryExists(dirName) {
    try {
        const dir = await chrome.runtime.getPackageDirectoryEntry();
        const entries = await new Promise((resolve, reject) => {
            dir.createReader().readEntries(resolve, reject);
        });
        return entries.some(entry => entry.isDirectory && entry.name === dirName);
    } catch (error) {
        console.error('Error checking directory:', error);
        return false;
    }
}

async function createDirectory(dirName) {
    try {
        const dir = await chrome.runtime.getPackageDirectoryEntry();
        await new Promise((resolve, reject) => {
            dir.getDirectory(dirName, { create: true }, resolve, reject);
        });
        return true;
    } catch (error) {
        console.error('Error creating directory:', error);
        return false;
    }
}

async function saveFile(path, content) {
    try {
        const blob = new Blob([content], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await chrome.downloads.download({
            url: url,
            filename: path,
            saveAs: false
        });
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Error saving file:', error);
        return false;
    }
}

async function initializeChart() {
    if (chartInitialized) return;
    
    if (chartInitPromise) {
        return chartInitPromise;
    }

    chartInitPromise = new Promise(async (resolve, reject) => {
        try {
            if (typeof ApexCharts === 'undefined') {
                // Try to load from local file first
                const script = document.createElement('script');
                script.src = 'lib/apexcharts.min.js';
                script.async = true;
                
                // If local file fails, download it
                script.onerror = async () => {
                    console.log('Local ApexCharts not found, downloading...');
                    const downloaded = await downloadApexCharts();
                    if (downloaded) {
                        // Try loading again after download
                        script.src = 'lib/apexcharts.min.js?' + new Date().getTime();
                        document.head.appendChild(script);
                    } else {
                        reject(new Error('Failed to load ApexCharts'));
                    }
                };
                
                script.onload = () => {
                    // Verify ApexCharts is properly loaded
                    if (typeof ApexCharts === 'undefined') {
                        reject(new Error('ApexCharts failed to load properly'));
                        return;
                    }
                    chartInitialized = true;
                    resolve();
                };
                
                document.head.appendChild(script);
            } else {
                chartInitialized = true;
                resolve();
            }
        } catch (error) {
            console.error('Error initializing chart:', error);
            reject(error);
        }
    });

    return chartInitPromise;
}

// Update the manifest to include necessary permissions
async function checkAndUpdateManifest() {
    try {
        const manifest = chrome.runtime.getManifest();
        const requiredPermissions = ['downloads', 'storage'];
        
        const missingPermissions = requiredPermissions.filter(
            perm => !manifest.permissions.includes(perm)
        );
        
        if (missingPermissions.length > 0) {
            console.warn('Missing required permissions:', missingPermissions);
            // You might want to show a message to the user about updating permissions
        }
    } catch (error) {
        console.error('Error checking manifest:', error);
    }
}

// Optimize chart update
async function updatePortfolioChart(holdings) {
    try {
        await initializeChart();

        const chartContainer = document.getElementById('portfolioChart');
        if (!chartContainer) return;

        // Clear any pending chart updates
        if (chartUpdateTimeout) {
            clearTimeout(chartUpdateTimeout);
        }

        // Extract data for chart
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

        if (labels.length === 0) {
            showChartError(chartContainer, 'No holdings to display');
            return;
        }

        // Schedule chart update to avoid UI blocking
        chartUpdateTimeout = setTimeout(() => {
            // Clear existing chart
            if (window.portfolioChart && typeof window.portfolioChart.destroy === 'function') {
                try {
                    window.portfolioChart.destroy();
                } catch (destroyErr) {
                    console.warn('Error destroying previous chart:', destroyErr);
                }
            }
            window.portfolioChart = null;

            // Clear the container
            chartContainer.innerHTML = '';

            const options = {
                series: values,
                chart: {
                    type: 'pie',
                    height: 280,
                    width: '100%',
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 500
                    },
                    toolbar: {
                        show: false
                    },
                    redrawOnWindowResize: false
                },
                labels: labels,
                colors: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
                ],
                legend: {
                    position: 'right',
                    fontSize: '12px',
                    markers: {
                        width: 10,
                        height: 10,
                        radius: 5
                    },
                    itemMargin: {
                        horizontal: 5,
                        vertical: 3
                    }
                },
                tooltip: {
                    y: {
                        formatter: function(value) {
                            const percentage = ((value / totalValue) * 100).toFixed(1);
                            return `$${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '0%'
                        },
                        customScale: 0.8
                    }
                },
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            height: 250
                        },
                        legend: {
                            position: 'bottom',
                            fontSize: '11px'
                        }
                    }
                }]
            };

            // Create new chart instance
            window.portfolioChart = new ApexCharts(chartContainer, options);
            
            // Wait for the chart to be fully rendered
            window.portfolioChart.render().then(() => {
                // Force a redraw after a short delay to ensure proper rendering
                setTimeout(() => {
                    window.portfolioChart.render();
                }, 100);
            });
        }, 0);

    } catch (error) {
        console.error('Error in updatePortfolioChart:', error);
        const chartContainer = document.getElementById('portfolioChart');
        if (chartContainer) {
            showChartError(chartContainer, 'Error creating chart: ' + error.message);
        }
    }
}

function showChartError(container, message) {
    container.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #666;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        ">
            ${message}
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Update theme colors
    updateThemeColors();
    
    // Listen for theme changes
    chrome.theme.onUpdated.addListener(() => {
        updateThemeColors();
    });
    
    // Check and update manifest if needed
    await checkAndUpdateManifest();
    
    // Add event listeners
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', handleAdd);
    }

    const removeBtn = document.getElementById('removeBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', handleRemove);
    }

    const form = document.getElementById('currencyForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    // Initial UI update
    await updateUI();

    // Update UI every minute with throttling
    setInterval(throttledUpdateUI, 60000);
    
    // Add visibility change listener for better performance
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            debouncedUpdateUI();
        }
    });
}); 