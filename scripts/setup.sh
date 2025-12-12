#!/bin/bash

# BotDojo SDK Playground Setup Script
#
# This script uses the BotDojo CLI to:
# 1. Authenticate with BotDojo (botdojo login)
# 2. Use existing CLI project (never auto-switches projects)
# 3. Pull latest flow OR clone the SDK test flow
# 4. Create an API key for the flow (botdojo flow api_key create)
# 5. Generate .env.local with all required configuration

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

# Flow URIs to clone
BASIC_FLOW_URI="botdojo.com/botdojo/sdk-test-flows/3112f8a1-c539-11f0-9a90-1dbafe764d7e"
MODEL_CONTEXT_FLOW_URI="botdojo.com/botdojo/sdk-test-flows/390baa60-c95e-11f0-978d-47bef2a9ac47"

# Header
echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🤖 BotDojo Chat SDK Playground Setup                       ║"
echo "║                                                               ║"
echo "║   This script will help you set up the playground            ║"
echo "║   with everything you need to explore the Chat SDK.          ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}\n"

# Step 1: Check CLI Installation
echo -e "${BOLD}${CYAN}🔍 Checking BotDojo CLI Installation${RESET}\n"

if ! command -v botdojo &> /dev/null; then
    echo -e "${RED}✗ BotDojo CLI is not installed${RESET}\n"
    echo "Please install it first:"
    echo "  npm install -g @botdojo/cli"
    echo "  or"
    echo "  pnpm add -g @botdojo/cli"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ BotDojo CLI is installed${RESET}\n"

# Step 2: Authenticate
echo -e "${BOLD}${CYAN}🔐 Authenticating with BotDojo${RESET}\n"

# Check if already logged in
if botdojo status &> /dev/null; then
    STATUS_OUTPUT=$(botdojo status 2>&1)
    if echo "$STATUS_OUTPUT" | grep -q "Account:" && echo "$STATUS_OUTPUT" | grep -q "Project:"; then
        echo -e "${GREEN}✓ Already authenticated with BotDojo${RESET}\n"
    else
        echo -e "${BLUE}ℹ Running botdojo login (will open browser)...${RESET}\n"
        botdojo login --suggested-project-name "SDK Playground"
        echo -e "${GREEN}✓ Successfully authenticated${RESET}\n"
    fi
else
    echo -e "${BLUE}ℹ You will need to login or create a free BotDojo account.${RESET}"
    echo -e "${BLUE}  This will open your browser for authentication.${RESET}\n"
    echo -e "${CYAN}Press any key to continue...${RESET}"
    read -n 1 -s -r
    echo ""
    echo -e "${BLUE}ℹ Opening browser for login...${RESET}\n"
    botdojo login --suggested-project-name "SDK Playground"
    echo -e "${GREEN}✓ Successfully authenticated${RESET}\n"
fi

# Step 3: Check for existing account/project or create new one
echo -e "${BOLD}${CYAN}📋 Setting up SDK Playground Project${RESET}\n"

ENV_FILE="$(dirname "$0")/../.env.local"
ACCOUNT_ID=""
PROJECT_ID=""

# Get current CLI context from config.json (more reliable than parsing status output)
CLI_CONFIG_FILE="$HOME/.botdojo/config.json"
CLI_ACCOUNT_ID=""
CLI_PROJECT_ID=""

if [ -f "$CLI_CONFIG_FILE" ]; then
    # Use jq if available, otherwise fall back to grep
    if command -v jq &> /dev/null; then
        CLI_ACCOUNT_ID=$(jq -r '.accountId // empty' "$CLI_CONFIG_FILE" 2>/dev/null)
        CLI_PROJECT_ID=$(jq -r '.projectId // empty' "$CLI_CONFIG_FILE" 2>/dev/null)
    else
        # Fallback to grep if jq not available
        CLI_ACCOUNT_ID=$(grep -o '"accountId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CLI_CONFIG_FILE" | grep -o "[a-f0-9-]\{36\}" | head -1)
        CLI_PROJECT_ID=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CLI_CONFIG_FILE" | grep -o "[a-f0-9-]\{36\}" | head -1)
    fi
fi

# If config.json didn't have values, try botdojo status as fallback
if [ -z "$CLI_ACCOUNT_ID" ] || [ -z "$CLI_PROJECT_ID" ]; then
    STATUS_OUTPUT=$(botdojo status 2>&1)
    if [ -z "$CLI_ACCOUNT_ID" ]; then
        CLI_ACCOUNT_ID=$(echo "$STATUS_OUTPUT" | grep "Account ID:" | grep -o "[a-f0-9-]\{36\}")
    fi
    if [ -z "$CLI_PROJECT_ID" ]; then
        CLI_PROJECT_ID=$(echo "$STATUS_OUTPUT" | grep "Project ID:" | grep -o "[a-f0-9-]\{36\}")
    fi
fi

echo -e "${BLUE}Current CLI context:${RESET}"
echo -e "  Account ID: ${CLI_ACCOUNT_ID:-Not set}"
echo -e "  Project ID: ${CLI_PROJECT_ID:-Not set}\n"

# Check if .env.local exists and has account/project IDs
if [ -f "$ENV_FILE" ]; then
    ENV_ACCOUNT_ID=$(grep "NEXT_PUBLIC_ACCOUNT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    ENV_PROJECT_ID=$(grep "NEXT_PUBLIC_PROJECT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$ENV_ACCOUNT_ID" ] && [ -n "$ENV_PROJECT_ID" ]; then
        # Check if .env.local matches current CLI context
        if [ "$ENV_PROJECT_ID" = "$CLI_PROJECT_ID" ]; then
            echo -e "${GREEN}✓ .env.local matches current CLI project${RESET}\n"
            ACCOUNT_ID="$CLI_ACCOUNT_ID"
            PROJECT_ID="$CLI_PROJECT_ID"
        else
            echo -e "${RED}✗ Project mismatch detected${RESET}\n"
            echo -e "${YELLOW}Your .env.local has a different project than your current CLI context.${RESET}"
            echo -e "${YELLOW}Setup will NOT automatically switch projects to prevent confusion.${RESET}\n"
            echo -e "  .env.local Account: ${ENV_ACCOUNT_ID}"
            echo -e "  .env.local Project: ${ENV_PROJECT_ID}"
            echo -e "  CLI Account:        ${CLI_ACCOUNT_ID:-Not set}"
            echo -e "  CLI Project:        ${CLI_PROJECT_ID:-Not set}\n"
            echo -e "${BLUE}To continue with the project from .env.local, run:${RESET}\n"
            echo -e "  ${CYAN}botdojo switch --account-id ${ENV_ACCOUNT_ID} --project-id ${ENV_PROJECT_ID}${RESET}\n"
            echo -e "${BLUE}Then run this setup script again.${RESET}\n"
            
            exit 1
        fi
    fi
fi

# If no account/project set yet, use current CLI context or prompt user to login
if [ -z "$ACCOUNT_ID" ] || [ -z "$PROJECT_ID" ]; then
    # Always prefer current CLI project if it's set - never switch away from it
    if [ -n "$CLI_ACCOUNT_ID" ] && [ -n "$CLI_PROJECT_ID" ]; then
        echo -e "${GREEN}✓ Using current CLI project (no .env.local found)${RESET}\n"
        ACCOUNT_ID="$CLI_ACCOUNT_ID"
        PROJECT_ID="$CLI_PROJECT_ID"
    else
        # CLI doesn't have a project set - run login to let user select/create one
        echo -e "${RED}✗ No project configured in CLI${RESET}\n"
        echo -e "${YELLOW}Please run login to select or create a project for this playground:${RESET}\n"
        echo -e "  ${CYAN}botdojo login --suggested-project-name \"SDK Playground\"${RESET}\n"
        echo -e "${BLUE}This will help you create or select a project for the playground.${RESET}"
        echo -e "${BLUE}Then run this setup script again.${RESET}\n"
        
        exit 1
    fi
    
    echo -e "${BLUE}Account ID: ${ACCOUNT_ID}${RESET}"
    echo -e "${BLUE}Project ID: ${PROJECT_ID}${RESET}\n"
fi

# Step 4: Check for existing flows or clone new ones
echo -e "${BOLD}${CYAN}📥 Setting up SDK Test Flows${RESET}\n"

# Check if project changed from .env.local - if so, we need to find/clone flows fresh
PROJECT_CHANGED=false
if [ -f "$ENV_FILE" ]; then
    ENV_PROJECT_ID=$(grep "NEXT_PUBLIC_PROJECT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -n "$ENV_PROJECT_ID" ] && [ "$ENV_PROJECT_ID" != "$PROJECT_ID" ]; then
        PROJECT_CHANGED=true
        echo -e "${YELLOW}ℹ Project changed - will look for existing flows in current project${RESET}\n"
    fi
fi

# Get list of flows in current project
echo -e "${BLUE}ℹ Checking for existing flows in project...${RESET}\n"
FLOW_LIST=$(botdojo flow list 2>&1 || echo "")

# --- Basic Flow ---
echo -e "${BOLD}1. Basic Flow (Simple Test)${RESET}"
BASIC_FLOW_ID=""
BASIC_FLOW_NAME="SDK - Basic Test Flow"
BASIC_FLOW_NEWLY_CLONED=false

# First, check if flow already exists in current project by name
if echo "$FLOW_LIST" | grep -q "$BASIC_FLOW_NAME"; then
    # Extract the flow ID for this flow name
    BASIC_FLOW_ID=$(echo "$FLOW_LIST" | grep "$BASIC_FLOW_NAME" | grep -o "[a-f0-9-]\{36\}" | head -1)
    if [ -n "$BASIC_FLOW_ID" ]; then
        echo -e "${GREEN}✓ Found existing flow '$BASIC_FLOW_NAME' in project: ${BASIC_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        # Pull latest from origin
        PULL_OUTPUT=$(botdojo pull-from-origin "$BASIC_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Basic flow updated from origin${RESET}\n"
        else
            echo -e "\n${YELLOW}⚠️  Could not pull from origin (flow may not have a source)${RESET}"
            echo -e "${GREEN}✓ Using existing basic flow${RESET}\n"
        fi
    fi
fi

# If flow not found in project and project didn't change, check .env.local
if [ -z "$BASIC_FLOW_ID" ] && [ "$PROJECT_CHANGED" = false ] && [ -f "$ENV_FILE" ]; then
    EXISTING_BASIC_FLOW_ID=$(grep "NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_FLOW_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$EXISTING_BASIC_FLOW_ID" ]; then
        echo -e "${YELLOW}ℹ Found flow ID in .env.local: ${EXISTING_BASIC_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        PULL_OUTPUT=$(botdojo pull-from-origin "$EXISTING_BASIC_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Basic flow updated from origin${RESET}\n"
            BASIC_FLOW_ID="$EXISTING_BASIC_FLOW_ID"
        elif echo "$PULL_OUTPUT" | grep -qi "not found\|error"; then
            echo -e "\n${YELLOW}⚠️  Flow not found in project, will clone fresh${RESET}\n"
        else
            echo -e "\n${GREEN}✓ Using existing basic flow${RESET}\n"
            BASIC_FLOW_ID="$EXISTING_BASIC_FLOW_ID"
        fi
    fi
fi

# If still no basic flow, clone a new one
if [ -z "$BASIC_FLOW_ID" ]; then
    echo -e "${BLUE}ℹ Cloning basic flow from ${BASIC_FLOW_URI}...${RESET}\n"
    
    CLONE_OUTPUT=$(botdojo cloneToProject "$BASIC_FLOW_URI" --name "$BASIC_FLOW_NAME" 2>&1)
    echo "$CLONE_OUTPUT"
    
    # Extract flow ID from output
    BASIC_FLOW_ID=$(echo "$CLONE_OUTPUT" | grep -i "ID:" | head -1 | grep -o "[a-f0-9-]\{36\}")
    
    if [ -z "$BASIC_FLOW_ID" ]; then
        echo -e "\n${RED}✗ Failed to extract basic flow ID from clone output${RESET}\n"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ Basic flow cloned successfully: ${BASIC_FLOW_ID}${RESET}\n"
    BASIC_FLOW_NEWLY_CLONED=true
fi

# --- Model Context Flow ---
echo -e "${BOLD}2. Model Context Flow${RESET}"
MODEL_CONTEXT_FLOW_ID=""
MODEL_CONTEXT_FLOW_NAME="SDK - With Model Context"
MODEL_CONTEXT_FLOW_NEWLY_CLONED=false

# First, check if flow already exists in current project by name
if echo "$FLOW_LIST" | grep -q "$MODEL_CONTEXT_FLOW_NAME"; then
    # Extract the flow ID for this flow name
    MODEL_CONTEXT_FLOW_ID=$(echo "$FLOW_LIST" | grep "$MODEL_CONTEXT_FLOW_NAME" | grep -o "[a-f0-9-]\{36\}" | head -1)
    if [ -n "$MODEL_CONTEXT_FLOW_ID" ]; then
        echo -e "${GREEN}✓ Found existing flow '$MODEL_CONTEXT_FLOW_NAME' in project: ${MODEL_CONTEXT_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        # Pull latest from origin
        PULL_OUTPUT=$(botdojo pull-from-origin "$MODEL_CONTEXT_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Model context flow updated from origin${RESET}\n"
        else
            echo -e "\n${YELLOW}⚠️  Could not pull from origin (flow may not have a source)${RESET}"
            echo -e "${GREEN}✓ Using existing model context flow${RESET}\n"
        fi
    fi
fi

# If flow not found in project and project didn't change, check .env.local
if [ -z "$MODEL_CONTEXT_FLOW_ID" ] && [ "$PROJECT_CHANGED" = false ] && [ -f "$ENV_FILE" ]; then
    EXISTING_MODEL_CONTEXT_FLOW_ID=$(grep "NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$EXISTING_MODEL_CONTEXT_FLOW_ID" ]; then
        echo -e "${YELLOW}ℹ Found flow ID in .env.local: ${EXISTING_MODEL_CONTEXT_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        PULL_OUTPUT=$(botdojo pull-from-origin "$EXISTING_MODEL_CONTEXT_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Model context flow updated from origin${RESET}\n"
            MODEL_CONTEXT_FLOW_ID="$EXISTING_MODEL_CONTEXT_FLOW_ID"
        elif echo "$PULL_OUTPUT" | grep -qi "not found\|error"; then
            echo -e "\n${YELLOW}⚠️  Flow not found in project, will clone fresh${RESET}\n"
        else
            echo -e "\n${GREEN}✓ Using existing model context flow${RESET}\n"
            MODEL_CONTEXT_FLOW_ID="$EXISTING_MODEL_CONTEXT_FLOW_ID"
        fi
    fi
fi

# If still no model context flow, clone a new one
if [ -z "$MODEL_CONTEXT_FLOW_ID" ]; then
    echo -e "${BLUE}ℹ Cloning model context flow from ${MODEL_CONTEXT_FLOW_URI}...${RESET}\n"
    
    CLONE_OUTPUT=$(botdojo cloneToProject "$MODEL_CONTEXT_FLOW_URI" --name "$MODEL_CONTEXT_FLOW_NAME" 2>&1)
    echo "$CLONE_OUTPUT"
    
    # Extract flow ID from output
    MODEL_CONTEXT_FLOW_ID=$(echo "$CLONE_OUTPUT" | grep -i "ID:" | head -1 | grep -o "[a-f0-9-]\{36\}")
    
    if [ -z "$MODEL_CONTEXT_FLOW_ID" ]; then
        echo -e "\n${RED}✗ Failed to extract model context flow ID from clone output${RESET}\n"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ Model context flow cloned successfully: ${MODEL_CONTEXT_FLOW_ID}${RESET}\n"
    MODEL_CONTEXT_FLOW_NEWLY_CLONED=true
fi

# Step 5: Create API Keys
echo -e "${BOLD}${CYAN}🔑 Creating API Keys${RESET}\n"

# --- Basic Flow API Key ---
echo -e "${BOLD}1. Basic Flow API Key${RESET}"
BASIC_API_KEY=""
BASIC_API_KEY_NAME="SDK Playground - Basic"

# Check if API key already exists in .env.local
if [ -f "$ENV_FILE" ]; then
    EXISTING_BASIC_API_KEY=$(grep "NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -n "$EXISTING_BASIC_API_KEY" ]; then
        echo -e "${GREEN}✓ Found existing API key in .env.local${RESET}\n"
        BASIC_API_KEY="$EXISTING_BASIC_API_KEY"
    fi
fi

# Only create API key if flow was newly cloned and we don't have one in .env.local
if [ -z "$BASIC_API_KEY" ] && [ "$BASIC_FLOW_NEWLY_CLONED" = true ]; then
    echo -e "${BLUE}ℹ Creating API key for newly cloned basic flow...${RESET}\n"
    BASIC_API_KEY_OUTPUT=$(botdojo flow api_key create "$BASIC_FLOW_ID" --name "$BASIC_API_KEY_NAME" 2>&1)
    echo "$BASIC_API_KEY_OUTPUT"
    
    # Extract API key from output (matches UUID format or hex strings)
    BASIC_API_KEY=$(echo "$BASIC_API_KEY_OUTPUT" | grep -i "API Key:" | sed -E 's/.*API Key:[[:space:]]*([a-f0-9-]+).*/\1/I' | tr -d ' ')
    
    if [ -z "$BASIC_API_KEY" ]; then
        echo -e "\n${RED}✗ Failed to extract basic API key from output${RESET}\n"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ Basic flow API key created successfully${RESET}\n"
elif [ -z "$BASIC_API_KEY" ]; then
    # Flow exists but no API key in .env.local - assume one exists for the flow
    echo -e "${BLUE}ℹ Flow already exists - assuming API key exists for this flow${RESET}\n"
    echo -e "${YELLOW}⚠️  No API key found in .env.local. You may need to add it manually.${RESET}\n"
    echo -e "${YELLOW}To create a new API key, run:${RESET}\n"
    echo -e "  ${CYAN}botdojo flow api_key create ${BASIC_FLOW_ID} --name \"${BASIC_API_KEY_NAME}\"${RESET}\n"
    # Continue without API key - user can add it later
    BASIC_API_KEY=""
fi

# --- Model Context Flow API Key ---
echo -e "${BOLD}2. Model Context Flow API Key${RESET}"
MODEL_CONTEXT_API_KEY=""
MODEL_CONTEXT_API_KEY_NAME="SDK Playground - Model Context"

# Check if API key already exists in .env.local
if [ -f "$ENV_FILE" ]; then
    EXISTING_MODEL_CONTEXT_API_KEY=$(grep "NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -n "$EXISTING_MODEL_CONTEXT_API_KEY" ]; then
        echo -e "${GREEN}✓ Found existing API key in .env.local${RESET}\n"
        MODEL_CONTEXT_API_KEY="$EXISTING_MODEL_CONTEXT_API_KEY"
    fi
fi

# Only create API key if flow was newly cloned and we don't have one in .env.local
if [ -z "$MODEL_CONTEXT_API_KEY" ] && [ "$MODEL_CONTEXT_FLOW_NEWLY_CLONED" = true ]; then
    echo -e "${BLUE}ℹ Creating API key for newly cloned model context flow...${RESET}\n"
    MODEL_CONTEXT_API_KEY_OUTPUT=$(botdojo flow api_key create "$MODEL_CONTEXT_FLOW_ID" --name "$MODEL_CONTEXT_API_KEY_NAME" 2>&1)
    echo "$MODEL_CONTEXT_API_KEY_OUTPUT"
    
    # Extract API key from output (matches UUID format or hex strings)
    MODEL_CONTEXT_API_KEY=$(echo "$MODEL_CONTEXT_API_KEY_OUTPUT" | grep -i "API Key:" | sed -E 's/.*API Key:[[:space:]]*([a-f0-9-]+).*/\1/I' | tr -d ' ')
    
    if [ -z "$MODEL_CONTEXT_API_KEY" ]; then
        echo -e "\n${RED}✗ Failed to extract model context API key from output${RESET}\n"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ Model context flow API key created successfully${RESET}\n"
elif [ -z "$MODEL_CONTEXT_API_KEY" ]; then
    # Flow exists but no API key in .env.local - assume one exists for the flow
    echo -e "${BLUE}ℹ Flow already exists - assuming API key exists for this flow${RESET}\n"
    echo -e "${YELLOW}⚠️  No API key found in .env.local. You may need to add it manually.${RESET}\n"
    echo -e "${YELLOW}To create a new API key, run:${RESET}\n"
    echo -e "  ${CYAN}botdojo flow api_key create ${MODEL_CONTEXT_FLOW_ID} --name \"${MODEL_CONTEXT_API_KEY_NAME}\"${RESET}\n"
    # Continue without API key - user can add it later
    MODEL_CONTEXT_API_KEY=""
fi

# Step 6: Write .env.local file
echo -e "${BOLD}${CYAN}📝 Writing Configuration${RESET}\n"

cat > "$ENV_FILE" << EOF
# =============================================================================
# USER-SPECIFIC CONFIGURATION (Generated by setup script)
# =============================================================================
# These values are unique to your account and should be kept private.
# Feel free to delete this section when sharing this file.
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Account & Project IDs
NEXT_PUBLIC_ACCOUNT_ID=${ACCOUNT_ID}
NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID}

# Basic Flow Configuration
NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_FLOW_ID=${BASIC_FLOW_ID}
NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_API=${BASIC_API_KEY}

# Model Context Flow Configuration
NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID=${MODEL_CONTEXT_FLOW_ID}
NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_API=${MODEL_CONTEXT_API_KEY}

# =============================================================================
# OPTIONAL: LOCAL DEVELOPMENT OVERRIDES
# =============================================================================
# Uncomment these to override production defaults for local development:
#
# NEXT_PUBLIC_BOTDOJO_API_URL=http://localhost:5001/api/v1
# NEXT_PUBLIC_BOTDOJO_SOCKET_URL=http://localhost:5001/api/v1/
# NEXT_PUBLIC_IFRAME_URL=http://localhost:3000
EOF

echo -e "${GREEN}✓ .env.local file created${RESET}\n"

# Done!
echo -e "${BOLD}${CYAN}🎉 Setup Complete!${RESET}\n"
echo -e "${GREEN}Your SDK playground is ready to use!${RESET}\n"
echo -e "${BOLD}Configuration:${RESET}"
echo -e "  Account ID:               ${ACCOUNT_ID}"
echo -e "  Project ID:               ${PROJECT_ID}"
echo -e "  Basic Flow ID:            ${BASIC_FLOW_ID}"
echo -e "  Basic API Key:            ${BASIC_API_KEY:0:20}..."
echo -e "  Model Context Flow ID:    ${MODEL_CONTEXT_FLOW_ID}"
echo -e "  Model Context API Key:    ${MODEL_CONTEXT_API_KEY:0:20}...\n"

# Prompt for directory name (default to sdk-playground)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_DIR_NAME=$(basename "$SCRIPT_DIR")
echo -e "${WHITE}What directory should be cloned to? (default: ${DEFAULT_DIR_NAME})${RESET}"
read -r CLONE_DIR
CLONE_DIR=${CLONE_DIR:-$DEFAULT_DIR_NAME}
echo -e "${WHITE}Using directory: ${CLONE_DIR}${RESET}\n"

echo -e "${WHITE}${BOLD}Starting development server...${RESET}\n"
cd "$SCRIPT_DIR" || exit 1

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait a moment for server to start
sleep 5

echo -e "${WHITE}${BOLD}Opening browser...${RESET}\n"
# Open browser (works on macOS, Linux with xdg-open, or Windows)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3500"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3500" 2>/dev/null || echo -e "${WHITE}Please open http://localhost:3500 in your browser${RESET}"
else
    echo -e "${WHITE}Please open http://localhost:3500 in your browser${RESET}"
fi

echo -e "\n${WHITE}${BOLD}Happy testing! 🚀${RESET}\n"
echo -e "${WHITE}Development server is running in the background (PID: ${DEV_PID})${RESET}"
echo -e "${WHITE}To stop the server, run: kill ${DEV_PID}${RESET}\n"

