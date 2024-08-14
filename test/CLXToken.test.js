const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CLXToken", function () {
  let CLXToken;
  let clxToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    const CLXTokenFactory = await ethers.getContractFactory("CLXToken");
    clxToken = await CLXTokenFactory.deploy();
    await clxToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await clxToken.hasRole(await clxToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await clxToken.balanceOf(owner.address);
      expect(await clxToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await clxToken.transfer(addr1.address, 50);
      const addr1Balance = await clxToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await clxToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await clxToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await clxToken.balanceOf(owner.address);
      await expect(
        clxToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await clxToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow minting by minter role", async function () {
      await clxToken.mint(addr1.address, 100);
      expect(await clxToken.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should fail if minting exceeds max supply", async function () {
      const maxSupply = await clxToken.MAX_SUPPLY();
      await expect(
        clxToken.mint(addr1.address, maxSupply)
      ).to.be.revertedWith("CLX: Max supply exceeded");
    });
  });

  describe("Burning", function () {
    it("Should allow burning tokens", async function () {
      await clxToken.transfer(addr1.address, 100);
      await clxToken.connect(addr1).burn(50);
      expect(await clxToken.balanceOf(addr1.address)).to.equal(50);
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause", async function () {
      await clxToken.pause();
      await expect(clxToken.transfer(addr1.address, 100)).to.be.revertedWith("Pausable: paused");
      await clxToken.unpause();
      await expect(clxToken.transfer(addr1.address, 100)).to.not.be.reverted;
    });
  });
});