import { Suspense } from "react";

import { CurrentRank } from "./_components/current-rank";
import { ReferralTree } from "./_components/referral-tree";

export default function Page() {
  return (
    <>
      <CurrentRank />
      <div className="px-6 pb-6">
        <Suspense>
          <ReferralTree />
        </Suspense>
      </div>
    </>
  );
}
