import { expect } from "chai";
import { ethers } from "hardhat";
import { InvoiceRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { parseUnits } from "ethers";

// Minimal ERC-20 for testing
const ERC20_ABI = [
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

async function deployMockToken(deployer: HardhatEthersSigner) {
  const factory = await ethers.getContractFactory("MockERC20");
  const token = await factory.deploy();
  await token.waitForDeployment();
  return token;
}

describe("InvoiceRegistry", function () {
  let registry: InvoiceRegistry;
  let owner: HardhatEthersSigner;
  let payer: HardhatEthersSigner;
  let other: HardhatEthersSigner;
  let mockToken: any;

  beforeEach(async () => {
    [owner, payer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("InvoiceRegistry");
    registry = (await factory.deploy()) as InvoiceRegistry;
    await registry.waitForDeployment();

    const tokenFactory = await ethers.getContractFactory("MockERC20");
    mockToken = await tokenFactory.deploy();
    await mockToken.waitForDeployment();
  });

  // ─── createInvoice ────────────────────────────────────────────────────────

  describe("createInvoice", () => {
    it("3.1 happy path: stores invoice, emits event, returns id", async () => {
      const amount = parseUnits("100", 18);
      const dueDate = Math.floor(Date.now() / 1000) + 86400;

      const tx = await registry.createInvoice(payer.address, await mockToken.getAddress(), amount, dueDate);
      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
        .find((e) => e?.name === "InvoiceCreated");

      expect(event).to.not.be.null;
      expect(event!.args.invoiceId).to.equal(1n);
      expect(event!.args.creator).to.equal(owner.address);
      expect(event!.args.payer).to.equal(payer.address);

      const inv = await registry.getInvoice(1n);
      expect(inv.creator).to.equal(owner.address);
      expect(inv.payer).to.equal(payer.address);
      expect(inv.amount).to.equal(amount);
      expect(inv.status).to.equal(0); // Pending
    });

    it("3.2 reverts on zero amount", async () => {
      await expect(
        registry.createInvoice(payer.address, await mockToken.getAddress(), 0n, 0n)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("3.2 reverts on zero address payer", async () => {
      await expect(
        registry.createInvoice(ethers.ZeroAddress, await mockToken.getAddress(), 100n, 0n)
      ).to.be.revertedWith("Invalid payer");
    });
  });

  // ─── pay ──────────────────────────────────────────────────────────────────

  describe("pay", () => {
    const amount = parseUnits("50", 18);

    beforeEach(async () => {
      await registry.createInvoice(payer.address, await mockToken.getAddress(), amount, 0n);
      // mint tokens to payer and approve the registry
      await mockToken.mint(payer.address, amount);
      await mockToken.connect(payer).approve(await registry.getAddress(), amount);
    });

    it("3.3 happy path: transfers tokens, status → Paid, emits InvoicePaid", async () => {
      const creatorBefore = await mockToken.balanceOf(owner.address);
      const tx = await registry.connect(payer).pay(1n);
      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
        .find((e) => e?.name === "InvoicePaid");

      expect(event).to.not.be.null;
      expect(event!.args.invoiceId).to.equal(1n);

      const inv = await registry.getInvoice(1n);
      expect(inv.status).to.equal(1); // Paid

      const creatorAfter = await mockToken.balanceOf(owner.address);
      expect(creatorAfter - creatorBefore).to.equal(amount);
    });

    it("3.4 reverts when called by non-payer", async () => {
      await expect(registry.connect(other).pay(1n)).to.be.revertedWith("Not the payer");
    });

    it("3.4 reverts when already paid", async () => {
      await registry.connect(payer).pay(1n);
      await mockToken.mint(payer.address, amount);
      await mockToken.connect(payer).approve(await registry.getAddress(), amount);
      await expect(registry.connect(payer).pay(1n)).to.be.revertedWith("Invoice not payable");
    });

    it("3.4 reverts on insufficient allowance (transferFrom fails)", async () => {
      // revoke allowance
      await mockToken.connect(payer).approve(await registry.getAddress(), 0n);
      await expect(registry.connect(payer).pay(1n)).to.be.reverted;
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────

  describe("cancel", () => {
    beforeEach(async () => {
      await registry.createInvoice(payer.address, await mockToken.getAddress(), 100n, 0n);
    });

    it("3.5 happy path: status → Cancelled, emits InvoiceCancelled", async () => {
      const tx = await registry.cancel(1n);
      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
        .find((e) => e?.name === "InvoiceCancelled");

      expect(event).to.not.be.null;
      const inv = await registry.getInvoice(1n);
      expect(inv.status).to.equal(2); // Cancelled
    });

    it("3.5 reverts when called by non-creator", async () => {
      await expect(registry.connect(payer).cancel(1n)).to.be.revertedWith("Not the creator");
    });

    it("3.5 reverts on already-Paid invoice", async () => {
      const amount = 100n;
      await mockToken.mint(payer.address, amount);
      await mockToken.connect(payer).approve(await registry.getAddress(), amount);
      await registry.connect(payer).pay(1n);
      await expect(registry.cancel(1n)).to.be.revertedWith("Cannot cancel");
    });
  });

  // ─── getInvoice ───────────────────────────────────────────────────────────

  describe("getInvoice", () => {
    it("returns zero values for non-existent invoice (no revert)", async () => {
      const inv = await registry.getInvoice(999n);
      expect(inv.creator).to.equal(ethers.ZeroAddress);
      expect(inv.amount).to.equal(0n);
    });
  });
});
