import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Aries Chain",
  version: packageJson.version,
  copyright: `© ${currentYear}, Aries Chain Support Network.`,
  meta: {
    title: "Aries Chain - Enterprise-Grade Blockchain Support Network & Node Portal",
    description:
      "Aries Chain is a highly scalable, decentralized blockchain protocol designed for high-throughput transactional efficiency, smart contract automation, and utility portal routing. Monitor validator nodes, manage utility credit, and engage with the decentralized Aries ecosystem.",
  },
};
