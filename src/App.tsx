import React from "react";
import { SidekickProvider } from "./context/SidekickContext";
import HomeScreen from "./components/HomeScreen";

function AppContent() {
  return <HomeScreen />;
}

export default function App() {
  return (
    <SidekickProvider>
      <AppContent />
    </SidekickProvider>
  );
} 