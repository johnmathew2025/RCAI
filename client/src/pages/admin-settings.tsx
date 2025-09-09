import React from "react";
import AIProvidersTable from "@/components/AIProvidersTable";

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">AI Settings</h2>
      <AIProvidersTable />
    </div>
  );
}