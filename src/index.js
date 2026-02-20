import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, getAllConfig, isConfigured } from './config.js';
import {
  getBalance,
  getAddressInfo,
  listTransactions,
  getBlock,
  getBlockByHeight,
  getLatestBlock,
  getUnconfirmedTransactions,
  getTransaction,
  getExchangeRates,
  convertToBTC,
  getStats,
  getPools
} from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

program
  .name('blockchain')
  .description(chalk.bold('Blockchain.info CLI') + ' - Bitcoin blockchain explorer')
  .version('1.0.0');

// CONFIG
const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'API key (optional)')
  .action((opts) => {
    if (opts.apiKey) {
      setConfig('apiKey', opts.apiKey);
      printSuccess('API key configured');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = getAllConfig();
    console.log(chalk.bold('Current configuration:'));
    console.log(JSON.stringify({ ...config, apiKey: config.apiKey ? '***' : '' }, null, 2));
  });

// BALANCE
program
  .command('balance <address>')
  .description('Get balance for a Bitcoin address')
  .option('--json', 'Output as JSON')
  .action(async (address, opts) => {
    try {
      const data = await withSpinner('Fetching balance...', () => getBalance(address));
      if (opts.json) {
        printJson(data);
      } else {
        const addressData = data[address];
        if (addressData) {
          printSuccess('Balance information:');
          console.log(`  Final Balance: ${addressData.final_balance / 100000000} BTC`);
          console.log(`  Total Received: ${addressData.total_received / 100000000} BTC`);
          console.log(`  Total Sent: ${addressData.total_sent / 100000000} BTC`);
          console.log(`  Transactions: ${addressData.n_tx}`);
        }
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ADDRESS INFO
program
  .command('address <address>')
  .description('Get detailed address information')
  .option('--limit <number>', 'Limit number of transactions')
  .option('--offset <number>', 'Offset for pagination')
  .option('--json', 'Output as JSON')
  .action(async (address, opts) => {
    try {
      const params = {};
      if (opts.limit) params.limit = opts.limit;
      if (opts.offset) params.offset = opts.offset;

      const data = await withSpinner('Fetching address info...', () => getAddressInfo(address, params));
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess('Address information:');
        console.log(`  Address: ${data.address}`);
        console.log(`  Hash160: ${data.hash160}`);
        console.log(`  Total Received: ${data.total_received / 100000000} BTC`);
        console.log(`  Total Sent: ${data.total_sent / 100000000} BTC`);
        console.log(`  Final Balance: ${data.final_balance / 100000000} BTC`);
        console.log(`  Transactions: ${data.n_tx}`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// TRANSACTIONS
program
  .command('transactions <address>')
  .description('List transactions for an address')
  .option('--limit <number>', 'Limit number of transactions')
  .option('--offset <number>', 'Offset for pagination')
  .option('--json', 'Output as JSON')
  .action(async (address, opts) => {
    try {
      const params = {};
      if (opts.limit) params.limit = opts.limit;
      if (opts.offset) params.offset = opts.offset;

      const data = await withSpinner('Fetching transactions...', () => listTransactions(address, params));
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess(`Found ${data.n_tx} transactions`);
        if (data.txs) {
          data.txs.slice(0, 10).forEach(tx => {
            console.log(`\n${chalk.bold(tx.hash)}`);
            console.log(`  Time: ${new Date(tx.time * 1000).toISOString()}`);
            console.log(`  Size: ${tx.size} bytes`);
            console.log(`  Block Height: ${tx.block_height || 'Unconfirmed'}`);
          });
        }
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// TRANSACTION
program
  .command('transaction <hash>')
  .description('Get transaction details')
  .option('--json', 'Output as JSON')
  .action(async (hash, opts) => {
    try {
      const data = await withSpinner('Fetching transaction...', () => getTransaction(hash));
      if (opts.json) {
        printJson(data);
      } else {
        console.log(`\n${chalk.bold('Transaction')}: ${data.hash}`);
        console.log(`  Time: ${new Date(data.time * 1000).toISOString()}`);
        console.log(`  Size: ${data.size} bytes`);
        console.log(`  Block Height: ${data.block_height || 'Unconfirmed'}`);
        console.log(`  Inputs: ${data.inputs?.length || 0}`);
        console.log(`  Outputs: ${data.out?.length || 0}`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// BLOCK
program
  .command('block <hash>')
  .description('Get block information by hash')
  .option('--json', 'Output as JSON')
  .action(async (hash, opts) => {
    try {
      const data = await withSpinner('Fetching block...', () => getBlock(hash));
      if (opts.json) {
        printJson(data);
      } else {
        console.log(`\n${chalk.bold('Block')}: ${data.hash}`);
        console.log(`  Height: ${data.height}`);
        console.log(`  Time: ${new Date(data.time * 1000).toISOString()}`);
        console.log(`  Transactions: ${data.n_tx}`);
        console.log(`  Size: ${data.size} bytes`);
        console.log(`  Version: ${data.ver}`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// BLOCK BY HEIGHT
program
  .command('block-height <height>')
  .description('Get block information by height')
  .option('--json', 'Output as JSON')
  .action(async (height, opts) => {
    try {
      const data = await withSpinner('Fetching block...', () => getBlockByHeight(height));
      if (opts.json) {
        printJson(data);
      } else {
        const blocks = data.blocks || [];
        printSuccess(`Found ${blocks.length} block(s) at height ${height}`);
        blocks.forEach(block => {
          console.log(`\n${chalk.bold('Block Hash')}: ${block.hash}`);
          console.log(`  Time: ${new Date(block.time * 1000).toISOString()}`);
          console.log(`  Transactions: ${block.n_tx}`);
        });
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// LATEST BLOCK
program
  .command('latest-block')
  .description('Get the latest block')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const data = await withSpinner('Fetching latest block...', () => getLatestBlock());
      if (opts.json) {
        printJson(data);
      } else {
        console.log(`\n${chalk.bold('Latest Block')}`);
        console.log(`  Hash: ${data.hash}`);
        console.log(`  Height: ${data.height}`);
        console.log(`  Time: ${new Date(data.time * 1000).toISOString()}`);
        console.log(`  Block Index: ${data.block_index}`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// UNCONFIRMED TRANSACTIONS
program
  .command('unconfirmed')
  .description('Get unconfirmed transactions')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const data = await withSpinner('Fetching unconfirmed transactions...', () => getUnconfirmedTransactions());
      if (opts.json) {
        printJson(data);
      } else {
        const txs = data.txs || [];
        printSuccess(`Found ${txs.length} unconfirmed transactions`);
        txs.slice(0, 10).forEach(tx => {
          console.log(`  ${tx.hash} - ${tx.size} bytes`);
        });
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// EXCHANGE RATES
program
  .command('rates')
  .description('Get current Bitcoin exchange rates')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const data = await withSpinner('Fetching exchange rates...', () => getExchangeRates());
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess('Exchange rates:');
        Object.entries(data).forEach(([currency, info]) => {
          console.log(`  ${currency}: ${info.symbol}${info.last.toLocaleString()}`);
        });
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// CONVERT TO BTC
program
  .command('convert <currency> <value>')
  .description('Convert currency to BTC')
  .option('--json', 'Output as JSON')
  .action(async (currency, value, opts) => {
    try {
      const data = await withSpinner('Converting...', () => convertToBTC(currency, value));
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess(`${value} ${currency.toUpperCase()} = ${data} BTC`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// STATS
program
  .command('stats')
  .description('Get blockchain statistics')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const data = await withSpinner('Fetching stats...', () => getStats());
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess('Blockchain statistics:');
        console.log(`  Market Price (USD): $${data.market_price_usd?.toLocaleString()}`);
        console.log(`  Hash Rate: ${data.hash_rate?.toLocaleString()}`);
        console.log(`  Total BTC Sent: ${(data.total_btc_sent / 100000000)?.toLocaleString()} BTC`);
        console.log(`  Blocks Count: ${data.n_blocks_total?.toLocaleString()}`);
        console.log(`  Total Fees: ${data.total_fees_btc?.toLocaleString()} BTC`);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// POOLS
program
  .command('pools')
  .description('Get mining pool information')
  .option('--timespan <period>', 'Timespan (5days, 10days)', '5days')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const data = await withSpinner('Fetching pool info...', () => getPools(opts.timespan));
      if (opts.json) {
        printJson(data);
      } else {
        printSuccess('Mining pools:');
        Object.entries(data).forEach(([pool, count]) => {
          console.log(`  ${pool}: ${count} blocks`);
        });
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse();
