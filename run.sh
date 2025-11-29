#!/bin/bash

# MicroGate - Quick Start Script for Unix/Linux/Mac
# Runs both backend and frontend servers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function show_help() {
    echo ""
    echo -e "${CYAN}MicroGate - System Runner${NC}"
    echo "========================="
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./run.sh           # Start backend and frontend"
    echo "  ./run.sh --agent   # Also run the AI agent"
    echo "  ./run.sh --help    # Show this help message"
    echo ""
    exit 0
}

# Parse arguments
RUN_AGENT=false
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
elif [[ "$1" == "--agent" ]] || [[ "$1" == "-a" ]]; then
    RUN_AGENT=true
fi

echo ""
echo "============================================================"
echo "  MicroGate - AI Agent Payment System"
echo "============================================================"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Pre-flight checks
log_info "Running pre-flight checks..."

ALL_CHECKS_PASS=true

# Check backend .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log_error "Backend .env file not found"
    log_warning "Copy backend/.env.example to backend/.env and configure it"
    ALL_CHECKS_PASS=false
fi

# Check frontend .env
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    log_error "Frontend .env file not found"
    log_warning "Copy frontend/.env.example to frontend/.env and configure it"
    ALL_CHECKS_PASS=false
fi

# Check backend node_modules
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log_error "Backend dependencies not installed"
    log_warning "Run: cd backend && npm install"
    ALL_CHECKS_PASS=false
fi

# Check frontend node_modules
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log_error "Frontend dependencies not installed"
    log_warning "Run: cd frontend && npm install"
    ALL_CHECKS_PASS=false
fi

if [ "$ALL_CHECKS_PASS" = false ]; then
    echo ""
    log_error "Pre-flight checks failed. Please fix the issues above."
    exit 1
fi

log_success "All pre-flight checks passed!"
echo ""

# Store PIDs for cleanup
BACKEND_PID=""
FRONTEND_PID=""
AGENT_PID=""

# Cleanup function
cleanup() {
    echo ""
    log_warning "Stopping all processes..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID 2>/dev/null || true
    fi
    
    # Kill any remaining node processes from this script
    pkill -P $$ 2>/dev/null || true
    
    log_success "All processes stopped. Goodbye! 👋"
    exit 0
}

# Register cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend
log_info "Starting backend server..."
cd "$BACKEND_DIR"
npm start > /tmp/microgate-backend.log 2>&1 &
BACKEND_PID=$!
log_success "Backend server started (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 3

# Start frontend
log_info "Starting frontend development server..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/microgate-frontend.log 2>&1 &
FRONTEND_PID=$!
log_success "Frontend server started (PID: $FRONTEND_PID)"

# Wait for frontend to initialize
sleep 3

echo ""
echo "============================================================"
log_success "MicroGate is running!"
echo "============================================================"
echo ""
log_info "Backend API:        http://localhost:3000"
log_info "Frontend Dashboard: http://localhost:5173"
log_info "Health Check:       http://localhost:3000/api/health"
echo ""
log_warning "Press Ctrl+C to stop all processes"
echo ""

# Start agent if requested
if [ "$RUN_AGENT" = true ]; then
    echo ""
    log_info "Starting AI agent..."
    sleep 2
    cd "$BACKEND_DIR"
    npm run agent &
    AGENT_PID=$!
    log_success "Agent started (PID: $AGENT_PID)"
else
    echo ""
    echo -e "${MAGENTA}[TIP]${NC} To run the AI agent: cd backend && npm run agent"
    echo ""
fi

# Monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "Backend process has stopped"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        log_error "Frontend process has stopped"
        cleanup
    fi
    
    if [ ! -z "$AGENT_PID" ] && ! kill -0 $AGENT_PID 2>/dev/null; then
        log_warning "Agent process has completed or stopped"
        AGENT_PID=""
    fi
    
    sleep 2
done
