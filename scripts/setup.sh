#!/bin/bash

# BotDojo SDK Playground Setup Script
#
# This script uses the BotDojo CLI to:
# 1. Authenticate with BotDojo (botdojo login)
# 2. Switch to existing account/project OR create "SDK Playground" project
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
        botdojo login
        echo -e "${GREEN}✓ Successfully authenticated${RESET}\n"
    fi
else
    echo -e "${BLUE}ℹ Running botdojo login (will open browser)...${RESET}\n"
    botdojo login
    echo -e "${GREEN}✓ Successfully authenticated${RESET}\n"
fi

# Step 3: Check for existing account/project or create new one
echo -e "${BOLD}${CYAN}📋 Setting up SDK Playground Project${RESET}\n"

ENV_FILE="$(dirname "$0")/../.env.local"
ACCOUNT_ID=""
PROJECT_ID=""

# Get current CLI context (what the user is currently logged into)
STATUS_OUTPUT=$(botdojo status 2>&1)
CLI_ACCOUNT_ID=$(echo "$STATUS_OUTPUT" | grep "Account ID:" | grep -o "[a-f0-9-]\{36\}")
CLI_PROJECT_ID=$(echo "$STATUS_OUTPUT" | grep "Project ID:" | grep -o "[a-f0-9-]\{36\}")

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
            echo -e "${YELLOW}⚠️  .env.local has different project than current CLI context${RESET}"
            echo -e "  .env.local Project: ${ENV_PROJECT_ID}"
            echo -e "  CLI Project:        ${CLI_PROJECT_ID}\n"
            echo -e "${BLUE}ℹ Using current CLI project (you can switch with 'botdojo switch')${RESET}\n"
            # Use CLI context, will clone fresh flows for this project
            ACCOUNT_ID="$CLI_ACCOUNT_ID"
            PROJECT_ID="$CLI_PROJECT_ID"
        fi
    fi
fi

# If CLI doesn't have account/project set, create/select project
if [ -z "$ACCOUNT_ID" ] || [ -z "$PROJECT_ID" ]; then
    echo -e "${BLUE}ℹ Creating/selecting project 'SDK Playground'...${RESET}\n"
    botdojo project create "SDK Playground" --yes
    echo -e "${GREEN}✓ Project setup complete${RESET}\n"
    
    # Get status info again after project creation
    STATUS_OUTPUT=$(botdojo status 2>&1)
    ACCOUNT_ID=$(echo "$STATUS_OUTPUT" | grep "Account ID:" | grep -o "[a-f0-9-]\{36\}")
    PROJECT_ID=$(echo "$STATUS_OUTPUT" | grep "Project ID:" | grep -o "[a-f0-9-]\{36\}")
    
    if [ -z "$ACCOUNT_ID" ] || [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}✗ Failed to get account/project information${RESET}\n"
        echo -e "${YELLOW}Status output:${RESET}"
        echo "$STATUS_OUTPUT"
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
fi

# --- Model Context Flow ---
echo -e "${BOLD}2. Model Context Flow${RESET}"
MODEL_CONTEXT_FLOW_ID=""
MODEL_CONTEXT_FLOW_NAME="SDK - With Model Context"

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
fi

# Step 5: Create API Keys
echo -e "${BOLD}${CYAN}🔑 Creating API Keys${RESET}\n"

# --- Basic Flow API Key ---
echo -e "${BOLD}1. Basic Flow API Key${RESET}"
echo -e "${BLUE}ℹ Creating API key for basic flow...${RESET}\n"

BASIC_API_KEY_OUTPUT=$(botdojo flow api_key create "$BASIC_FLOW_ID" --name "SDK Playground - Basic" 2>&1)
echo "$BASIC_API_KEY_OUTPUT"

# Extract API key from output
BASIC_API_KEY=$(echo "$BASIC_API_KEY_OUTPUT" | grep -i "API Key:" | grep -o "[a-f0-9-]\{36\}")

if [ -z "$BASIC_API_KEY" ]; then
    echo -e "\n${RED}✗ Failed to extract basic API key from output${RESET}\n"
    exit 1
fi

echo -e "\n${GREEN}✓ Basic flow API key created successfully${RESET}\n"

# --- Model Context Flow API Key ---
echo -e "${BOLD}2. Model Context Flow API Key${RESET}"
echo -e "${BLUE}ℹ Creating API key for model context flow...${RESET}\n"

MODEL_CONTEXT_API_KEY_OUTPUT=$(botdojo flow api_key create "$MODEL_CONTEXT_FLOW_ID" --name "SDK Playground - Model Context" 2>&1)
echo "$MODEL_CONTEXT_API_KEY_OUTPUT"

# Extract API key from output
MODEL_CONTEXT_API_KEY=$(echo "$MODEL_CONTEXT_API_KEY_OUTPUT" | grep -i "API Key:" | grep -o "[a-f0-9-]\{36\}")

if [ -z "$MODEL_CONTEXT_API_KEY" ]; then
    echo -e "\n${RED}✗ Failed to extract model context API key from output${RESET}\n"
    exit 1
fi

echo -e "\n${GREEN}✓ Model context flow API key created successfully${RESET}\n"

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
echo -e "${BOLD}Next steps:${RESET}"
echo -e "  1. Install dependencies:"
echo -e "     ${CYAN}npm install${RESET}\n"
echo -e "  2. Start the development server:"
echo -e "     ${CYAN}npm run dev${RESET}\n"
echo -e "  3. Open your browser:"
echo -e "     ${CYAN}http://localhost:3500${RESET}\n"
echo -e "${YELLOW}Note:${RESET} The playground defaults to production BotDojo servers.
echo -e "      To use local servers, uncomment the overrides in .env.local.
echo -e "For production, update the API URLs in .env.local.\n"
echo -e "Happy testing! 🚀\n"

