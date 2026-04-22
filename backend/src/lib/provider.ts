import { ethers } from "ethers";

let _provider: ethers.JsonRpcProvider;
let _wallet: ethers.Wallet;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  }
  return _provider;
}

export function getWallet(): ethers.Wallet {
  if (!_wallet) {
    const key = process.env.PRIVATE_KEY;
    if (!key) throw new Error("PRIVATE_KEY env var not set");
    _wallet = new ethers.Wallet(key, getProvider());
  }
  return _wallet;
}

export function resetProvider() {
  _provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  _wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, _provider);
}
