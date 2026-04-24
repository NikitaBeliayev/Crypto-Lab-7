const hre = require("hardhat");

async function main() {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();
  const initial = ethers.parseEther("1000");

  const V1 = await ethers.getContractFactory("MyTokenV1");
  const proxy = await upgrades.deployProxy(
    V1,
    ["MyToken", "MTK", initial, deployer.address],
    { kind: "uups", initializer: "initialize" }
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const impl1 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Proxy:", proxyAddress, "| impl v1:", impl1);

  const V2 = await ethers.getContractFactory("MyTokenV2");
  const up = await upgrades.upgradeProxy(proxyAddress, V2);
  if (up.deployTransaction) {
    const r = await up.deployTransaction.wait();
    console.log("Upgrade tx hash:", r.hash);
  }
  const impl2 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const t = await ethers.getContractAt("MyTokenV2", proxyAddress);
  console.log("Impl v2:", impl2, "| version():", await t.version());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
