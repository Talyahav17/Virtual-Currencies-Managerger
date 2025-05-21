# Virtual Currencies Manager Chrome Extension

A Chrome extension that helps you manage your virtual currency holdings across multiple trading systems. Track your cryptocurrency holdings, view their total value in USD, and see your portfolio distribution in a pie chart.

## Features

- Add or remove amounts of various cryptocurrencies (BTC, ETH, BNB, SOL, ADA, XRP, DOT, DOGE)
- View total value of all holdings in USD
- Visualize portfolio distribution with an interactive pie chart
- Real-time price updates from CoinGecko API
- Theme-aware UI that matches your browser's theme
- Responsive design with Bootstrap 5

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Virtual Currencies Manager"
3. Click "Add to Chrome"

### Manual Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/virtual-currencies-manager.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Development

### Prerequisites
- Chrome browser
- Git
- Basic knowledge of HTML, CSS, and JavaScript

### Project Structure
```
virtual-currencies-manager/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.js              # UI logic
├── dao.js               # Data access layer
├── service.js           # API integration
├── styles.css           # Custom styling
├── lib/                 # Third-party libraries
└── icons/              # Extension icons
```

### Building from Source
1. Clone the repository
2. Make your changes
3. Test the extension locally
4. Submit a pull request

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- ApexCharts
- CoinGecko API
- Chrome Extension APIs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for providing the cryptocurrency price data
- [Bootstrap](https://getbootstrap.com/) for the UI framework
- [ApexCharts](https://apexcharts.com/) for the charting library 