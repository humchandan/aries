import { ProfileManager } from "./_components/profile-manager";

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information and KYC documents.</p>
      </div>
      <ProfileManager />
    </div>
  );
}
