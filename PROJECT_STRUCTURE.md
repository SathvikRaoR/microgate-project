# MicroGate Project Structure

```
microgate-project/
├── backend/                  # Express.js API server
│   ├── server.js            # Main API server with payment verification
│   ├── agent.js             # AI agent that autonomously pays for access
│   ├── package.json         # Backend dependencies
│   ├── .env                 # Environment configuration (not in git)
│   ├── .env.example         # Environment template
│   └── .gitignore
│
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── App.jsx          # Main dashboard component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite build configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── .env                 # Frontend environment (not in git)
│   ├── .env.example         # Frontend environment template
│   └── .gitignore
│
└── README.md                # Main documentation
```

## Key Files

### Backend
- **server.js**: REST API with payment verification endpoint
- **agent.js**: Autonomous AI agent that pays for API access
- **.env**: Private keys, wallet addresses, RPC URLs

### Frontend
- **App.jsx**: Dashboard to monitor agent balance and add funds
- **vite.config.js**: Build tool configuration
- **tailwind.config.js**: UI styling configuration

## Getting Started

See [README.md](../README.md) for complete setup instructions.
