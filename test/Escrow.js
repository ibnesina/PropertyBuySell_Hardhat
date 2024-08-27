const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    // const signers = await ethers.getSigners()
    // console.log(signers.length)

    // const buyer = signers[0]
    // const sellet = signers[1]

    [buyer, seller, inspector, lender] = await ethers.getSigners();

    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // console.log(await realEstate.getAddress())

    // console.log("Contract address:", realEstate.address);

    // Mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );

    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      await realEstate.getAddress(),
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve property
    transaction = await realEstate
      .connect(seller)
      .approve(await escrow.getAddress(), 1);
    await transaction.wait();

    // List Property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });

  // This describes a suite of tests related to the "Deployment".
  describe("Deployment", () => {
    // This test checks if the deployed escrow contract returns the correct NFT address.
    it("Returns NFT address", async () => {
      // Get the NFT address from the deployed escrow contract.
      const result = await escrow.nftAddress();
      // Expect the NFT address returned by the escrow contract to be equal to the address of the deployed real estate contract.
      expect(result).to.be.equal(await realEstate.getAddress());
    });

    // This test checks if the deployed escrow contract returns the correct seller address.
    it("Returns seller address", async () => {
      // Get the seller address from the deployed escrow contract.
      const result = await escrow.seller();
      // Expect the seller address returned by the escrow contract to be equal to the address of the seller.
      expect(result).to.be.equal(seller.address);
    });

    // This test checks if the deployed escrow contract returns the correct inspector address.
    it("Returns inspector address", async () => {
      // Get the inspector address from the deployed escrow contract.
      const result = await escrow.inspector();
      // Expect the inspector address returned by the escrow contract to be equal to the address of the inspector.
      expect(result).to.be.equal(inspector.address);
    });

    // This test checks if the deployed escrow contract returns the correct lender address.
    it("Returns lender address", async () => {
      // Get the lender address from the deployed escrow contract.
      const result = await escrow.lender();
      // Expect the lender address returned by the escrow contract to be equal to the address of the lender.
      expect(result).to.be.equal(lender.address);
    });
  });

  // This describes a suite of tests related to a "Listing".
  describe("Listing", () => {
    // This test checks if the listing is updated as listed.
    it("Update as listed", async () => {
      // It awaits the result of the 'isListed' function from the 'escrow' object with ID 1.
      const result = await escrow.isListed(1);
      // It expects the result to be equal to true.
      expect(result).to.be.equal(true);
    });

    // This test checks if ownership is updated correctly.
    it("Update ownership", async () => {
      // It expects the owner of the real estate with ID 1 to be equal to the address returned by 'getAddress' function of the 'escrow' object.
      expect(await realEstate.ownerOf(1)).to.be.equal(
        await escrow.getAddress()
      );
    });

    // This test checks if the buyer is returned correctly.
    it("Return buyer", async () => {
      // It awaits the result of the 'buyer' function from the 'escrow' object with ID 1.
      const result = await escrow.buyer(1);
      // It expects the result to be equal to the address of the buyer.
      expect(result).to.be.equal(buyer.address);
    });

    // This test checks if the purchase price is returned correctly.
    it("Return purchase price", async () => {
      // It awaits the result of the 'purchasePrice' function from the 'escrow' object with ID 1.
      const result = await escrow.purchasePrice(1);
      // It expects the result to be equal to a certain amount of tokens (presumably 10 tokens).
      expect(result).to.be.equal(tokens(10));
    });

    // This test checks if the escrow amount is returned correctly.
    it("Return escrow amount", async () => {
      // It awaits the result of the 'escrowAmount' function from the 'escrow' object with ID 1.
      const result = await escrow.escrowAmount(1);
      // It expects the result to be equal to a certain amount of tokens (presumably 5 tokens).
      expect(result).to.be.equal(tokens(5));
    });
  });

  // This describes a suite of tests related to "Deposits".
  describe("Deposits", () => {
    // This test checks if the contract balance is updated correctly after a deposit.
    it("Updates contract balance", async () => {
      // It creates a transaction by having the 'buyer' connect to the 'escrow' contract and calls the 'depositEarnest' function with parameters ID 1 and a value of 5 tokens.
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      // It waits for the transaction to be confirmed.
      await transaction.wait();
      // It retrieves the current balance of the contract.
      const result = await escrow.getBalance();
      // It expects the result (contract balance) to be equal to 5 tokens.
      expect(result).to.be.equal(tokens(5));
    });
  });

  // This describes a suite of tests related to "Inspection".
  describe("Inspection", () => {
    // This test checks if the inspection status is updated correctly.
    it("Updates inspection status", async () => {
      // It creates a transaction by having the 'inspector' connect to the 'escrow' contract and calls the 'updateInspectionStatus' function with parameters ID 1 and a status of true.
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      // It waits for the transaction to be confirmed.
      await transaction.wait();
      // It retrieves the current inspection status for the property with ID 1.
      const result = await escrow.inspectionPassed(1);
      // It expects the result (inspection status) to be equal to true, indicating that the inspection has passed.
      expect(result).to.be.equal(true);
    });
  });

  // This describes a suite of tests related to "Approval".
  describe("Approval", () => {
    // This test checks if the approval status is updated correctly.
    it("Updates approval status", async () => {
      // The buyer approves the sale.
      let transaction = await escrow.connect(buyer).approveSale(1);
      // Wait for the transaction to be confirmed.
      await transaction.wait();

      // The seller approves the sale.
      transaction = await escrow.connect(seller).approveSale(1);
      // Wait for the transaction to be confirmed.
      await transaction.wait();

      // The lender approves the sale.
      transaction = await escrow.connect(lender).approveSale(1);
      // Wait for the transaction to be confirmed.
      await transaction.wait();

      // Expect the approval status for each party to be true.
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  // This describes a suite of tests related to the "Sale".
  describe("Sale", async () => {
    // This beforeEach hook sets up the necessary conditions before each test.
    beforeEach(async () => {
      // Deposit earnest money into escrow.
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      // Update inspection status to true.
      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      // Approve sale: buyer, seller, and lender.
      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      // Send loan amount from lender to escrow.
      await lender.sendTransaction({
        to: await escrow.getAddress(),
        value: tokens(5),
      });

      // Finalize the sale.
      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    // This test checks if the escrow amount is returned correctly.
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      // Expects the escrow amount for the property with ID 1 to be equal to 5 tokens.
      expect(result).to.be.equal(tokens(5));
    });

    // This test checks if the balance of the escrow contract is updated correctly after the sale.
    it("Updates balance", async () => {
      // Expects the balance of the escrow contract to be equal to 0 after the sale.
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
