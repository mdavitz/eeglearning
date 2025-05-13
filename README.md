# Epilepsy Neurologist Scheduler

A comprehensive scheduling application designed for epilepsy neurologists at Mount Sinai, featuring multi-site scheduling, vacation management, and schedule swap capabilities.

## Features

- **Multi-site Scheduling**
  - Mount Sinai West EMU
  - Mount Sinai Hospital EMU
  - Weekend Call (MSW/MSH)
  - Weekend Buddy Call (MSM/MSQ)

- **User Management**
  - Add/remove neurologists and administrators
  - Role-based access control
  - User status tracking

- **Schedule Management**
  - Annual schedule overview
  - Weekly schedule display
  - Vacation and blocked rotation management
  - Epilepsy monitoring week assignments

- **Schedule Swaps**
  - Intuitive swap request system
  - Constraint validation
  - Approval workflow

- **Notifications**
  - Email notifications
  - Push notifications
  - Schedule change alerts
  - Swap request notifications

## Tech Stack

- **Frontend**
  - React with TypeScript
  - Material-UI for components
  - React Router for navigation
  - Date-fns for date manipulation

- **Backend** (Coming Soon)
  - Node.js with Express
  - PostgreSQL database
  - JWT authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:
   ```bash
   cd scheduling-app
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
scheduling-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── types/         # TypeScript interfaces
│   ├── utils/         # Utility functions
│   ├── hooks/         # Custom React hooks
│   └── context/       # React context providers
├── public/            # Static assets
└── package.json       # Project dependencies
```

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Mount Sinai Health System
- Department of Neurology
- Epilepsy Division 