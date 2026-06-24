const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "aries_mlm_super_secret_jwt_key_12345";
const token = jwt.sign({ walletAddress: "0x5ed6484123da3dec1834cd472e1ca6b53e97c7b6" }, JWT_SECRET, {
  expiresIn: "7d",
});

fetch("http://localhost:3000/api/admin/business-health", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => console.log("API Response:", data))
  .catch(console.error);
