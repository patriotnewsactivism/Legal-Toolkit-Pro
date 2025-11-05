// src/App.tsx
import React from "react";
import LegalToolkitPro from "@/components/LegalToolkitPro";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

const App: React.FC = () => {
  return (
    <SubscriptionProvider>
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-50">
        <div className="container-custom py-4 sm:py-6 lg:py-8">
          <LegalToolkitPro />
        </div>
      </div>
    </SubscriptionProvider>
  );
};

export default App;
