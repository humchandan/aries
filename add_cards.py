import os

filepath = "src/app/(main)/dashboard/ecommerce/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

imports_to_add = """
import { CustomerReviews } from "./_components/customer-reviews";
import { Inventory } from "./_components/inventory";
import { KpiStrip } from "./_components/kpi-strip";
import { RecentOrders } from "./_components/recent-orders";
import { StoreTraffic } from "./_components/store-traffic";
import { TopProducts } from "./_components/top-products";
import { TrafficSources } from "./_components/traffic-sources";
"""

jsx_to_add = """

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip />
        <div className="xl:col-span-5">
          <StoreTraffic />
        </div>
        <div className="xl:col-span-7">
          <TrafficSources />
        </div>
        <div className="xl:col-span-4">
          <TopProducts />
        </div>
        <div className="xl:col-span-4">
          <Inventory />
        </div>
        <div className="xl:col-span-4">
          <CustomerReviews />
        </div>
        <div className="xl:col-span-12">
          <RecentOrders />
        </div>
      </div>
"""

# add imports right after other local imports or at top
if "import {" in content:
    content = content.replace('import { Button } from "@/components/ui/button";', imports_to_add + '\nimport { Button } from "@/components/ui/button";')

# add JSX right before the ending </div> of the main flex col
content = content.replace("      {/* Edit Biller Dialog */}", jsx_to_add + "\n      {/* Edit Biller Dialog */}")

with open(filepath, "w") as f:
    f.write(content)
