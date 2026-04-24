const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOYMENT_FILE = path.join(__dirname, "..", "..", "last-deployment.json");

async function main() {
  if (hre.network.name === "mantleSepolia" && !process.env.PRIVATE_KEY) {
    throw new Error("Set PRIVATE_KEY in .env for mantleSepolia (see .env.example)");
  }

  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();

  const initialSupply = ethers.parseEther("1000000");
  const name = "MyToken";
  const symbol = "MTK";

  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
  const proxy = await upgrades.deployProxy(
    MyTokenV1,
    [name, symbol, initialSupply, deployer.address],
    { kind: "uups", initializer: "initialize" }
  );
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  const payload = {
    network: hre.network.name,
    chainId: hre.network.config.chainId
      ? String(hre.network.config.chainId)
      : (await deployer.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    initialSupplyWei: initialSupply.toString(),
    proxy: proxyAddress,
    implementation: implementationAddress,
  };

  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(payload, null, 2), "utf8");
  console.log("Written:", DEPLOYMENT_FILE);
  console.log("--- UUPS (ERC1967) — use PROXY in MetaMask ---");
  console.log("PROXY:          ", proxyAddress);
  console.log("Implementation: ", implementationAddress);
  if (hre.network.name === "mantleSepolia") {
    const base = "https://sepolia.mantlescan.xyz/address";
    console.log("Explorer (proxy):          ", `${base}/${proxyAddress}`);
    console.log("Explorer (implementation):", `${base}/${implementationAddress}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
