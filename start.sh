#!/bin/bash

# Laniakea x402 Services Startup Script
# This script starts all required services: Kora, Facilitator, API, and Client

set -e  # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting Laniakea x402 Services..."

# Define project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to check if a process is running
is_port_in_use() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Define service ports
KORA_PORT=8080
FACILITATOR_PORT=3000
API_PORT=4021
CLIENT_PORT=5173

# Check if services are already running
echo "🔍 Checking for existing service processes..."

if is_port_in_use $KORA_PORT; then
    echo "⚠️  Warning: Kora may already be running on port $KORA_PORT"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Startup aborted by user"
        exit 1
    fi
fi

if is_port_in_use $FACILITATOR_PORT; then
    echo "⚠️  Warning: Facilitator may already be running on port $FACILITATOR_PORT"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Startup aborted by user"
        exit 1
    fi
fi

if is_port_in_use $API_PORT; then
    echo "⚠️  Warning: API may already be running on port $API_PORT"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Startup aborted by user"
        exit 1
    fi
fi

if is_port_in_use $CLIENT_PORT; then
    echo "⚠️  Warning: Client may already be running on port $CLIENT_PORT"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Startup aborted by user"
        exit 1
    fi
fi

echo "✅ All clear to start services"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Function to start a service in a subshell to maintain the working directory
start_service() {
    local service_name=$1
    local directory=$2
    local start_command=$3
    local log_file=$4

    echo "🚀 Starting $service_name..."
    
    (
        cd "$PROJECT_ROOT/$directory" || { echo "❌ Failed to change to $PROJECT_ROOT/$directory"; exit 1; }
        
        # Start the service and redirect output to a log file
        eval $start_command > "$PROJECT_ROOT/$log_file" 2>&1 &
        local service_pid=$!
        
        echo "$service_name started with PID: $service_pid"
        
        # Store the PID in a file for potential cleanup
        echo $service_pid > "$PROJECT_ROOT/$log_file.pid"
        
        # Wait for the process to complete
        wait $service_pid
    ) &
}

# Verify Kora RPC server is running
echo "🔍 Verifying Kora RPC server on port $KORA_PORT..."

if ! is_port_in_use $KORA_PORT; then
    echo "⚠️  Kora RPC server doesn't appear to be running on port $KORA_PORT"
    echo "💡 Please ensure Kora is started separately with:"
    echo "   cd kora-source && kora rpc start --signers-config ./signers.toml --api-key kora_facilitator_api_key_example --port 8080"
    echo ""
else
    echo "✅ Kora RPC server is available on port $KORA_PORT"
fi

# Start services in the correct order
start_service "Facilitator" "facilitator" "pnpm run dev" "logs/facilitator.log"
FACILITATOR_PID=$!

sleep 2  # Brief pause to allow facilitator to start

start_service "API" "api" "pnpm run dev" "logs/api.log"
API_PID=$!

sleep 2  # Brief pause to allow API to start

# Start React frontend (main app)
start_service "React Frontend" "." "pnpm run dev" "logs/frontend.log"
FRONTEND_PID=$!

sleep 2  # Brief pause to allow frontend to start

# Start client demo in a subshell
(
    cd "$PROJECT_ROOT/client-demo" || { echo "❌ Failed to change to $PROJECT_ROOT/client-demo"; exit 1; }

    pnpm run start > "$PROJECT_ROOT/logs/client_demo.log" 2>&1 &
    client_pid=$!

    echo "Client demo started with PID: $client_pid"

    # Store the PID in a file
    echo $client_pid > "$PROJECT_ROOT/logs/client_demo.log.pid"

    # Wait for the process to complete
    wait $client_pid
) &

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📋 Service Status:"
echo "   Kora RPC:     http://localhost:$KORA_PORT (verify manually)"
echo "   Facilitator:  http://localhost:$FACILITATOR_PORT"
echo "   API:          http://localhost:$API_PORT"
echo "   React App:    http://localhost:$CLIENT_PORT"
echo "   Client Demo:  Console output"
echo ""
echo "📖 To view service logs:"
echo "   - Facilitator: tail -f $PROJECT_ROOT/logs/facilitator.log"
echo "   - API:         tail -f $PROJECT_ROOT/logs/api.log"
echo "   - Frontend:    tail -f $PROJECT_ROOT/logs/frontend.log"
echo "   - Client Demo: tail -f $PROJECT_ROOT/logs/client_demo.log"
echo ""
echo "🛑 To stop all services, run: pkill -f 'tsx\|node\|vite' or use Ctrl+C in each terminal"

# Wait for all background processes to complete
wait