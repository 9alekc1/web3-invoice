/**
 * Integration tests — requires a running Hardhat node:
 *   cd contracts && npx hardhat node
 *   cd contracts && npm run compile
 *   cd backend  && npm test
 */
import "dotenv/config";
import request from "supertest";
import { ethers } from "ethers";
import path from "path";
import db from "../src/lib/db";

// Dynamic import of compiled artifacts (available after `npx hardhat compile`)
let InvoiceRegistryArtifact: any;
let MockERC20Artifact: any;
try {
  InvoiceRegistryArtifact = require(path.resolve(__dirname, "../../contracts/artifacts/contracts/InvoiceRegistry.sol/InvoiceRegistry.json"));
  MockERC20Artifact = require(path.resolve(__dirname, "../../contracts/artifacts/contracts/MockERC20.sol/MockERC20.json"));
} catch {
  console.warn("Compiled artifacts not found — run `npx hardhat compile` in contracts/ first");
}

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const HARDHAT_PRIVKEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let app: any;
let registryAddress: string;
let tokenAddress: string;
let payerSigner: ethers.Wallet;
let deployer: ethers.Wallet;
let token: ethers.Contract;

beforeAll(async () => {
  if (!InvoiceRegistryArtifact) {
    console.error("Skipping tests: artifacts missing");
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signers = await provider.listAccounts();
  deployer = new ethers.Wallet(HARDHAT_PRIVKEY, provider);
  payerSigner = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);

  // Deploy InvoiceRegistry
  const registryFactory = new ethers.ContractFactory(InvoiceRegistryArtifact.abi, InvoiceRegistryArtifact.bytecode, deployer);
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();
  registryAddress = await registry.getAddress();

  // Deploy MockERC20 and mint to payer
  const tokenFactory = new ethers.ContractFactory(MockERC20Artifact.abi, MockERC20Artifact.bytecode, deployer);
  token = await tokenFactory.deploy();
  await token.waitForDeployment();
  tokenAddress = await token.getAddress();
  await (token as any).mint(payerSigner.address, ethers.parseUnits("1000", 18));

  // Configure env for the backend
  process.env.RPC_URL = RPC_URL;
  process.env.PRIVATE_KEY = HARDHAT_PRIVKEY;
  process.env.CONTRACT_ADDRESS = registryAddress;
  process.env.DATABASE_URL = "file:./test.db";

  // Reset module cache so config picks up new env vars
  jest.resetModules();
  const { app: _app } = await import("../src/index");
  app = _app;

  // Clean DB
  await db.invoice.deleteMany();
}, 30000);

afterAll(async () => {
  await db.invoice.deleteMany();
  await db.$disconnect();
});

describe("POST /invoices", () => {
  it("8.1 creates invoice and returns 201", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ payer: payerSigner.address, token: tokenAddress, amount: "100" });

    expect(res.status).toBe(201);
    expect(res.body.invoiceId).toBeDefined();
    expect(res.body.status).toBe("Pending");
  });

  it("returns 400 when payer is missing", async () => {
    const res = await request(app).post("/invoices").send({ token: tokenAddress, amount: "100" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/payer/);
  });

  it("returns 400 on invalid Ethereum address", async () => {
    const res = await request(app).post("/invoices").send({ payer: "not-an-address", token: tokenAddress, amount: "100" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid Ethereum address/);
  });
});

describe("GET /invoices/:id", () => {
  let invoiceId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ payer: payerSigner.address, token: tokenAddress, amount: "50" });
    invoiceId = res.body.invoiceId;
  });

  it("8.2 returns invoice for valid id", async () => {
    const res = await request(app).get(`/invoices/${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body.invoiceId).toBe(invoiceId);
  });

  it("8.2 returns 404 for unknown id", async () => {
    const res = await request(app).get("/invoices/99999");
    expect(res.status).toBe(404);
  });
});

describe("GET /invoices", () => {
  it("8.3 returns all invoices without filter", async () => {
    const res = await request(app).get("/invoices");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("8.3 filters by payer", async () => {
    const res = await request(app).get(`/invoices?payer=${payerSigner.address}`);
    expect(res.status).toBe(200);
    res.body.forEach((inv: any) => {
      expect(inv.payer.toLowerCase()).toBe(payerSigner.address.toLowerCase());
    });
  });
});

describe("DELETE /invoices/:id", () => {
  let invoiceId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ payer: payerSigner.address, token: tokenAddress, amount: "25" });
    invoiceId = res.body.invoiceId;
  });

  it("8.4 cancels a pending invoice", async () => {
    const res = await request(app).delete(`/invoices/${invoiceId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Cancelled");
  });

  it("8.4 returns 409 when invoice already cancelled", async () => {
    await request(app).delete(`/invoices/${invoiceId}`);
    const res = await request(app).delete(`/invoices/${invoiceId}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cannot be cancelled/);
  });
});
