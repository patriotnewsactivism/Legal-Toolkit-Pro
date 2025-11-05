# Legal Toolkit Pro

A comprehensive web application designed to help journalists, auditors, and civil rights advocates generate legal documents and access state-specific legal information.

## Features

### Document Generation
- **FOIA Requests** - Generate federal and state public records requests
- **State Public Records Requests** - State-specific freedom of information requests
- **ID Rights Card** - Printable card asserting constitutional rights
- **Cease and Desist Letters** - Legal notices to stop specific actions
- **Notice of Claim** - Pre-litigation claim notifications
- **Pre-Suit Notice** - Required notices before filing lawsuits
- **Subpoena Duces Tecum** - Document production requests
- **Discovery Requests** - Civil litigation discovery tools

### Legal Information Lookup
- **Cannabis Laws** - Comprehensive marijuana/cannabis regulations for all 50 states + DC
- **Stop and ID Laws** - State-specific identification requirements during police encounters
- **Public Records Laws** - Response timeframes and legal citations for each state
- **Hostile State Warnings** - Alerts for states known to be challenging for journalists/auditors

### Key Capabilities
- Fast document generation with minimal user input
- State-specific legal citations and timeframes
- Printable ID rights cards (PNG and PDF export)
- Copy-to-clipboard functionality
- Text file downloads
- Responsive design for all devices

## Tech Stack

- **React 19.1.1** - UI framework
- **TypeScript 5.9.2** - Type safety
- **Vite 7.1.5** - Build tool and dev server
- **Tailwind CSS 3.4.18** - Styling
- **Radix UI** - Accessible component primitives
- **Zod 4.1.8** - Schema validation
- **html-to-image** - ID card image generation
- **jsPDF** - PDF export functionality
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/patriotnewsactivism/Legal-Toolkit-Pro.git

# Navigate to project directory
cd Legal-Toolkit-Pro

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Or use the start command
npm start
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

## Project Structure

```
Legal-Toolkit-Pro/
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── LegalToolkitPro.tsx  # Main application component
│   │   └── PricingPlans.tsx     # Subscription pricing component
│   ├── context/
│   │   └── SubscriptionContext.tsx  # Subscription state management
│   ├── data/
│   │   └── legalDatasets.ts     # Legal data for all states
│   ├── schemas/
│   │   └── documentType.ts      # Type definitions
│   ├── test/
│   │   └── setup.ts             # Test configuration
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── dist/                        # Production build output
├── .prettierrc                  # Prettier configuration
├── .prettierignore              # Prettier ignore rules
├── eslint.config.js             # ESLint configuration
├── tailwind.config.cjs          # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
├── vitest.config.ts             # Vitest testing configuration
└── package.json                 # Project dependencies and scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm start` | Alias for dev command |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Data Sources

All legal information is sourced from official state statutes and government websites. The application includes:

- Public records laws for all 50 states + DC
- Cannabis/marijuana regulations with legal citations
- Stop and ID requirements by state
- Hostile state warnings for journalists and auditors

## Subscription Tiers

The application supports three subscription tiers:

- **Free** - Basic document generation
- **Pro** - Enhanced features and priority support
- **Enterprise** - Full access with advanced customization

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Disclaimer

This tool is designed to assist with legal document preparation and information lookup. It is not a substitute for professional legal advice. Users should consult with a licensed attorney for specific legal matters.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with modern React and TypeScript
- Powered by Vite for fast development
- Styled with Tailwind CSS
- UI components from Radix UI
- Legal data compiled from official government sources
