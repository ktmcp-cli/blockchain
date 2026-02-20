# Blockchain.com CLI - For AI Agents

This is a CLI tool for the Blockchain.com wallet and blockchain data API. Install it and use it directly instead of making HTTP requests.

## Installation

```bash
npm install -g @ktmcp-cli/blockchain
```

## Configuration

```bash
blockchain config set --api-key YOUR_API_KEY
```

## Common Tasks

### Check address balance
```bash
blockchain balance <bitcoin-address> --json
```

### Get transaction details
```bash
blockchain tx get <transaction-hash> --json
```

### List wallet addresses
```bash
blockchain addresses list --json
```

### Get wallet info
```bash
blockchain wallet info --json
```

### Check exchange rates
```bash
blockchain rates --json
blockchain rates btc --json
```

### Get blockchain statistics
```bash
blockchain stats --json
```

### Get block information
```bash
blockchain block latest --json
blockchain block get <block-height> --json
```

All commands support `--json` for machine-readable output.
