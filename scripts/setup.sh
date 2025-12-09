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

# Check if .env.local exists and has account/project IDs
if [ -f "$ENV_FILE" ]; then
    EXISTING_ACCOUNT_ID=$(grep "NEXT_PUBLIC_ACCOUNT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    EXISTING_PROJECT_ID=$(grep "NEXT_PUBLIC_PROJECT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$EXISTING_ACCOUNT_ID" ] && [ -n "$EXISTING_PROJECT_ID" ]; then
        echo -e "${YELLOW}ℹ Found existing account and project in .env.local${RESET}"
        echo -e "${BLUE}  Account ID: ${EXISTING_ACCOUNT_ID}${RESET}"
        echo -e "${BLUE}  Project ID: ${EXISTING_PROJECT_ID}${RESET}\n"
        echo -e "${BLUE}ℹ Switching to existing account and project...${RESET}\n"
        
        # Use botdojo switch to set the account and project
        # First switch account
        botdojo switch --account-id "$EXISTING_ACCOUNT_ID" --project-id "$EXISTING_PROJECT_ID" 2>&1 || {
            echo -e "${YELLOW}⚠️  Could not switch to existing account/project${RESET}"
            echo -e "${YELLOW}ℹ Will create/select project instead${RESET}\n"
            EXISTING_ACCOUNT_ID=""
            EXISTING_PROJECT_ID=""
        }
        
        if [ -n "$EXISTING_ACCOUNT_ID" ] && [ -n "$EXISTING_PROJECT_ID" ]; then
            ACCOUNT_ID="$EXISTING_ACCOUNT_ID"
            PROJECT_ID="$EXISTING_PROJECT_ID"
            echo -e "${GREEN}✓ Switched to existing account and project${RESET}\n"
        fi
    fi
fi

# If no existing account/project in .env, create/select project
if [ -z "$ACCOUNT_ID" ] || [ -z "$PROJECT_ID" ]; then
    echo -e "${BLUE}ℹ Creating/selecting project 'SDK Playground'...${RESET}\n"
    botdojo project create "SDK Playground" --yes
    echo -e "${GREEN}✓ Project setup complete${RESET}\n"
    
    # Get status info
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

# --- Basic Flow ---
echo -e "${BOLD}1. Basic Flow (Simple Test)${RESET}"
BASIC_FLOW_ID=""

# Check if .env.local exists and has a basic flow ID
if [ -f "$ENV_FILE" ]; then
    EXISTING_BASIC_FLOW_ID=$(grep "NEXT_PUBLIC_BOTDOJO_SIMPLE_TEST_FLOW_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$EXISTING_BASIC_FLOW_ID" ]; then
        echo -e "${YELLOW}ℹ Found existing basic flow ID: ${EXISTING_BASIC_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        # Pull latest from origin
        PULL_OUTPUT=$(botdojo pull-from-origin "$EXISTING_BASIC_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Basic flow updated from origin${RESET}\n"
            BASIC_FLOW_ID="$EXISTING_BASIC_FLOW_ID"
        else
            echo -e "\n${YELLOW}⚠️  Could not pull from origin (flow may not have a source)${RESET}"
            echo -e "${GREEN}✓ Using existing basic flow: ${EXISTING_BASIC_FLOW_ID}${RESET}\n"
            BASIC_FLOW_ID="$EXISTING_BASIC_FLOW_ID"
        fi
    fi
fi

# If no existing basic flow ID in .env, clone a new one
if [ -z "$BASIC_FLOW_ID" ]; then
    echo -e "${BLUE}ℹ No existing basic flow found, cloning from ${BASIC_FLOW_URI}...${RESET}\n"
    
    CLONE_OUTPUT=$(botdojo cloneToProject "$BASIC_FLOW_URI" --name "SDK - Basic Test Flow" 2>&1)
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

# Check if .env.local exists and has a model context flow ID
if [ -f "$ENV_FILE" ]; then
    EXISTING_MODEL_CONTEXT_FLOW_ID=$(grep "NEXT_PUBLIC_BOTDOJO_MODEL_CONTEXT_FLOW_ID=" "$ENV_FILE" | cut -d'=' -f2)
    
    if [ -n "$EXISTING_MODEL_CONTEXT_FLOW_ID" ]; then
        echo -e "${YELLOW}ℹ Found existing model context flow ID: ${EXISTING_MODEL_CONTEXT_FLOW_ID}${RESET}"
        echo -e "${BLUE}ℹ Pulling latest release from origin...${RESET}\n"
        
        # Pull latest from origin
        PULL_OUTPUT=$(botdojo pull-from-origin "$EXISTING_MODEL_CONTEXT_FLOW_ID" --yes 2>&1)
        echo "$PULL_OUTPUT"
        
        if echo "$PULL_OUTPUT" | grep -q "Successfully pulled"; then
            echo -e "\n${GREEN}✓ Model context flow updated from origin${RESET}\n"
            MODEL_CONTEXT_FLOW_ID="$EXISTING_MODEL_CONTEXT_FLOW_ID"
        else
            echo -e "\n${YELLOW}⚠️  Could not pull from origin (flow may not have a source)${RESET}"
            echo -e "${GREEN}✓ Using existing model context flow: ${EXISTING_MODEL_CONTEXT_FLOW_ID}${RESET}\n"
            MODEL_CONTEXT_FLOW_ID="$EXISTING_MODEL_CONTEXT_FLOW_ID"
        fi
    fi
fi

# If no existing model context flow ID in .env, clone a new one
if [ -z "$MODEL_CONTEXT_FLOW_ID" ]; then
    echo -e "${BLUE}ℹ No existing model context flow found, cloning from ${MODEL_CONTEXT_FLOW_URI}...${RESET}\n"
    
    CLONE_OUTPUT=$(botdojo cloneToProject "$MODEL_CONTEXT_FLOW_URI" --name "SDK - With Model Context" 2>&1)
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

