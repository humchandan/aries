const fs = require('fs');
const files = [
  'src/app/api/admin/utility/verify-signer/route.js',
  'src/app/api/admin/utility/verify-pin/route.js',
  'src/app/api/admin/utility/categories/route.js',
  'src/app/api/admin/utility/services/route.js',
  'src/app/api/admin/utility/media/route.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove ADMIN_ADDRESSES and isAdmin definition
  content = content.replace(/const ADMIN_ADDRESSES = \[\s*'[^']+'\s*\];\s*/g, '');
  content = content.replace(/function isAdmin\(walletAddress\) \{\s*if \(\!walletAddress\) return false;\s*return ADMIN_ADDRESSES\.includes\(walletAddress\.toLowerCase\(\)\);\s*\}\s*/g, '');
  
  // Add import
  if (!content.includes('checkIsAdmin')) {
    content = content.replace(/import \{ verifyToken \} from '@\/lib\/auth';/, "import { verifyToken } from '@/lib/auth';\nimport { checkIsAdmin } from '@/lib/admin';");
  }

  // Replace isAdmin(walletAddress) with (await checkIsAdmin(walletAddress))
  content = content.replace(/!isAdmin\(walletAddress\)/g, '!(await checkIsAdmin(walletAddress))');
  
  fs.writeFileSync(file, content);
}
console.log('Fixed all!');
