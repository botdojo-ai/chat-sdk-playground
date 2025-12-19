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

# Error handler to show better error messages
trap 'echo -e "\n${RED}✗ Setup encountered an issue${RESET}\n${YELLOW}The script exited with an error. Check the output above for details.${RESET}\n"' ERR

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

# Function to verify token works by making a test API call
verify_auth() {
    # Try listing flows - this will fail with 401 if token is expired
    botdojo flow list &> /dev/null
    return $?
}

# Check if already logged in AND token is valid
STATUS_OUTPUT=$(botdojo status 2>&1)

# Check for actual UUID values (not just "Not set")
# Use || true to prevent grep from failing with set -e when no match is found
HAS_ACCOUNT_UUID=$(echo "$STATUS_OUTPUT" | grep "Account ID:" | grep -o "[a-f0-9-]\{36\}" || true)
HAS_PROJECT_UUID=$(echo "$STATUS_OUTPUT" | grep "Project ID:" | grep -o "[a-f0-9-]\{36\}" || true)

if [ -n "$HAS_ACCOUNT_UUID" ] && [ -n "$HAS_PROJECT_UUID" ]; then
    # Fully configured, verify token actually works
    echo -e "${BLUE}ℹ Verifying authentication...${RESET}"
    if verify_auth; then
        echo -e "${GREEN}✓ Already authenticated with BotDojo${RESET}\n"
    else
        echo -e "${YELLOW}⚠️  Your session has expired. Refreshing...${RESET}\n"
        # Try reauth first (token refresh), fall back to full login
        if ! botdojo reauth 2>/dev/null; then
            echo -e "${YELLOW}Reauth failed, trying full login...${RESET}\n"
            # reauth failed, try full login (run directly for browser interaction)
            if ! botdojo login; then
                echo -e "${RED}✗ Authentication failed or was cancelled${RESET}\n"
                echo -e "${YELLOW}Please run 'botdojo login' manually and then run this setup again.${RESET}\n"
                exit 1
            fi
        fi
        echo -e "${GREEN}✓ Successfully re-authenticated${RESET}\n"
    fi
else
    # Not fully configured - need to login and select account/project
    echo -e "${BLUE}ℹ You will need to login or create a free BotDojo account.${RESET}"
    echo -e "${BLUE}  This will open your browser for authentication.${RESET}\n"
    
    # Check if running interactively (has TTY)
    if [ -t 0 ]; then
        echo -e "${CYAN}Press any key to continue...${RESET}"
        read -n 1 -s -r || true  # Ignore read failures
        echo ""
    fi
    
    echo -e "${BLUE}ℹ Opening browser for login...${RESET}\n"
    # Run login directly (not captured) so it can interact with terminal/browser properly
    if ! botdojo login --suggested-project-name "SDK Playground"; then
        echo -e "${RED}✗ Authentication failed or was cancelled${RESET}\n"
        echo -e "${YELLOW}Please run 'botdojo login' manually and then run this setup again.${RESET}\n"
        exit 1
    fi
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
        CLI_ACCOUNT_ID=$(grep -o '"accountId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CLI_CONFIG_FILE" | grep -o "[a-f0-9-]\{36\}" | head -1 || true)
        CLI_PROJECT_ID=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' "$CLI_CONFIG_FILE" | grep -o "[a-f0-9-]\{36\}" | head -1 || true)
    fi
fi

# If config.json didn't have values, try botdojo status as fallback
if [ -z "$CLI_ACCOUNT_ID" ] || [ -z "$CLI_PROJECT_ID" ]; then
    STATUS_OUTPUT=$(botdojo status 2>&1)
    if [ -z "$CLI_ACCOUNT_ID" ]; then
        CLI_ACCOUNT_ID=$(echo "$STATUS_OUTPUT" | grep "Account ID:" | grep -o "[a-f0-9-]\{36\}" || true)
    fi
    if [ -z "$CLI_PROJECT_ID" ]; then
        CLI_PROJECT_ID=$(echo "$STATUS_OUTPUT" | grep "Project ID:" | grep -o "[a-f0-9-]\{36\}" || true)
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
    EXISTING_BASIC_FLOW_ID=$(grep "NEXT_PUBLIC_BOTDOJO_BASIC_FLOW_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
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

# Step 5: Create API Key for Token Generation
echo -e "${BOLD}${CYAN}🔑 Creating API Key${RESET}\n"

# --- Model Context Flow API Key (server-side for token generation) ---
echo -e "${BOLD}Model Context Flow API Key (for token generation)${RESET}"
MODEL_CONTEXT_API_KEY=""
MODEL_CONTEXT_API_KEY_NAME="SDK Playground - Model Context"

# Check if API key already exists in .env.local
if [ -f "$ENV_FILE" ]; then
    EXISTING_MODEL_CONTEXT_API_KEY=$(grep "BOTDOJO_MODEL_CONTEXT_API=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -n "$EXISTING_MODEL_CONTEXT_API_KEY" ]; then
        echo -e "${GREEN}✓ Found existing API key in .env.local${RESET}\n"
        MODEL_CONTEXT_API_KEY="$EXISTING_MODEL_CONTEXT_API_KEY"
    fi
fi

# Create API key if we don't have one in .env.local
if [ -z "$MODEL_CONTEXT_API_KEY" ]; then
    echo -e "${BLUE}ℹ Creating API key for model context flow...${RESET}\n"
    MODEL_CONTEXT_API_KEY_OUTPUT=$(botdojo flow api_key create "$MODEL_CONTEXT_FLOW_ID" --name "$MODEL_CONTEXT_API_KEY_NAME" 2>&1)
    echo "$MODEL_CONTEXT_API_KEY_OUTPUT"
    
    # Extract API key from output (strip ANSI codes from spinner/other output, match UUID)
    MODEL_CONTEXT_API_KEY=$(echo "$MODEL_CONTEXT_API_KEY_OUTPUT" | sed 's/\x1b\[[0-9;]*m//g' | grep "API Key:" | sed -E 's/.*API Key:[[:space:]]*([a-fA-F0-9-]{36}).*/\1/' | head -1)
    
    if [ -z "$MODEL_CONTEXT_API_KEY" ]; then
        echo -e "\n${RED}✗ Failed to extract model context API key from output${RESET}\n"
        echo -e "${YELLOW}Debug: Raw output was:${RESET}\n"
        echo "$MODEL_CONTEXT_API_KEY_OUTPUT"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ Model context flow API key created successfully${RESET}\n"
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

# Flow IDs
NEXT_PUBLIC_BOTDOJO_BASIC_FLOW_ID=${BASIC_FLOW_ID}
NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID=${MODEL_CONTEXT_FLOW_ID}

# Server-side API Key (used for JWT token generation)
# This key is NOT exposed to the browser - tokens are generated server-side
BOTDOJO_MODEL_CONTEXT_API=${MODEL_CONTEXT_API_KEY}

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
echo -e "  Model Context Flow ID:    ${MODEL_CONTEXT_FLOW_ID}"
echo -e "  API Key (server-side):    ${MODEL_CONTEXT_API_KEY:0:20}...\n"

# Get the directory name for display
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIR_NAME=$(basename "$SCRIPT_DIR")

echo -e "${BOLD}${CYAN}📂 Next Steps${RESET}\n"
echo -e "${WHITE}Navigate to your playground:${RESET}"
echo -e "  ${CYAN}cd ${DIR_NAME}${RESET}\n"

echo -e "${WHITE}Start the development server:${RESET}"
echo -e "  ${CYAN}npm run dev${RESET}          ${WHITE}# Opens browser at http://localhost:3500${RESET}"
echo -e "  ${CYAN}npm run dev:ngrok${RESET}    ${WHITE}# Use ngrok for external access (requires ngrok)${RESET}\n"

echo -e "${BOLD}${GREEN}Happy testing! 🚀${RESET}\n"

