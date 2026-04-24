const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOYMENT_FILE = path.join(__dirname, "..", "..", "last-deployment.json");

async function main() {
  if (hre.network.name === "mantleSepolia" && !process.env.PRIVATE_KEY) {
    throw new Error("Set PRIVATE_KEY in .env for mantleSepolia (see .env.example)");
  }

  const { ethers, upgrades } = hre;
  const [signer] = await ethers.getSigners();

  let proxyAddress = process.env.PROXY_ADDRESS;
  if (!proxyAddress) {
    if (!fs.existsSync(DEPLOYMENT_FILE)) {
      throw new Error(
        `No PROXY_ADDRESS and no ${DEPLOYMENT_FILE}. Run deploy-v1.js on this network first, or set PROXY_ADDRESS.`
      );
    }
    const d = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
    if (d.network !== hre.network.name) {
      throw new Error(
        `last-deployment network "${d.network}" != current "${hre.network.name}". Use PROXY_ADDRESS or re-deploy.`
      );
    }
    proxyAddress = d.proxy;
  }

  const implBefore = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Signer:", signer.address, "(must be contract owner to upgrade)");
  console.log("Proxy: ", proxyAddress);
  console.log("Current implementation:", implBefore);

  const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MyTokenV2);
  if (upgraded.deployTransaction) {
    const receipt = await upgraded.deployTransaction.wait();
    console.log("Upgrade transaction hash:", receipt.hash);
  }

  const implAfter = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const token = await ethers.getContractAt("MyTokenV2", proxyAddress);
  const v = await token.version();

  console.log("--- Upgrade done ---");
  console.log("New implementation:", implAfter);
  console.log('version() via proxy: ', v, '(expected: "V2")');
  if (hre.network.name === "mantleSepolia") {
    const base = "https://sepolia.mantlescan.xyz/address";
    console.log("Explorer (proxy):         ", `${base}/${proxyAddress}`);
    console.log("Explorer (new impl):      ", `${base}/${implAfter}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
