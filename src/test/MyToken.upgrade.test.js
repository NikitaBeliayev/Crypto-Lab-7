const { expect } = require("chai");
const hre = require("hardhat");

describe("MyToken UUPS (proxy + V1 -> V2)", function () {
  it("mints and transfers on V1 via proxy, upgrades, keeps balances, exposes version() as V2", async function () {
    const { ethers, upgrades } = hre;
    const [owner, alice, bob] = await ethers.getSigners();
    const initial = ethers.parseEther("1000");

    const V1 = await ethers.getContractFactory("MyTokenV1");
    const proxy = await upgrades.deployProxy(
      V1,
      ["MyToken", "MTK", initial, owner.address],
      { kind: "uups", initializer: "initialize" }
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    const tokenV1 = await ethers.getContractAt("MyTokenV1", proxyAddress);
    await (await tokenV1.mint(alice.address, ethers.parseEther("50"))).wait();
    await (await tokenV1.connect(alice).transfer(bob.address, ethers.parseEther("10"))).wait();

    const aBefore = await tokenV1.balanceOf(alice.address);
    const bBefore = await tokenV1.balanceOf(bob.address);
    const ownerBefore = await tokenV1.balanceOf(owner.address);

    const V2 = await ethers.getContractFactory("MyTokenV2");
    await (await upgrades.upgradeProxy(proxyAddress, V2)).waitForDeployment();

    const tokenV2 = await ethers.getContractAt("MyTokenV2", proxyAddress);
    expect(await tokenV2.version()).to.equal("V2");

    expect(await tokenV2.balanceOf(alice.address)).to.equal(aBefore);
    expect(await tokenV2.balanceOf(bob.address)).to.equal(bBefore);
    expect(await tokenV2.balanceOf(owner.address)).to.equal(ownerBefore);
  });
});
