import BusinessLayout from "../components/BusinessLayout";
import StandardContentEditor from "./StandardContentEditor";
import StayContentEditor from "./StayContentEditor";
import { NAVY, MUTED } from "../components/FormKit";

const SECTION_LABELS = {
  "see-do": "See & Do", "eat-drink": "Eat & Drink", "shop": "Shop",
  "services": "Services", "live-stay": "Live & Stay",
};

export default function DashboardPage({ account, onLogout }) {
  return (
    <BusinessLayout account={account} onLogout={onLogout}>
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{account.businessName}</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Manage your {SECTION_LABELS[account.section] || account.section} page content — this is what visitors see on your public listing.
          </p>
        </div>

        {account.section === "live-stay" ? (
          <StayContentEditor account={account} />
        ) : (
          <StandardContentEditor account={account} />
        )}
      </div>
    </BusinessLayout>
  );
}
