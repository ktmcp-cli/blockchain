import axios from 'axios';
import { getConfig } from './config.js';

function getClient() {
  const baseUrl = getConfig('baseUrl') || 'https://blockchain.info';

  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

async function request(method, endpoint, params = null) {
  const client = getClient();
  try {
    const response = await client.request({
      method,
      url: endpoint,
      params
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(`API Error: ${error.response.data.message}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Get Balance
export async function getBalance(address) {
  return await request('GET', `/balance?active=${address}`);
}

// Get Address Info
export async function getAddressInfo(address, params = {}) {
  const queryParams = { ...params };
  return await request('GET', `/rawaddr/${address}`, queryParams);
}

// List Transactions
export async function listTransactions(address, params = {}) {
  return await request('GET', `/rawaddr/${address}`, params);
}

// Get Block
export async function getBlock(blockHash) {
  return await request('GET', `/rawblock/${blockHash}`);
}

// Get Block by Height
export async function getBlockByHeight(height) {
  return await request('GET', `/block-height/${height}?format=json`);
}

// Get Latest Block
export async function getLatestBlock() {
  return await request('GET', '/latestblock');
}

// Get Unconfirmed Transactions
export async function getUnconfirmedTransactions() {
  return await request('GET', '/unconfirmed-transactions?format=json');
}

// Get Single Transaction
export async function getTransaction(txHash) {
  return await request('GET', `/rawtx/${txHash}`);
}

// Get Exchange Rates
export async function getExchangeRates() {
  return await request('GET', '/ticker');
}

// Convert to BTC
export async function convertToBTC(currency, value) {
  return await request('GET', `/tobtc?currency=${currency}&value=${value}`);
}

// Get Stats
export async function getStats() {
  return await request('GET', '/stats?format=json');
}

// Get Pools
export async function getPools(timespan = '5days') {
  return await request('GET', `/pools?timespan=${timespan}&format=json`);
}
