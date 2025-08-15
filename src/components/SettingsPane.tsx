import { useContext, useState } from "react";
import { SidekickContext } from "../context/SidekickContext";

interface Props {
  onClose: () => void;
}

export default function SettingsPane({ onClose }: Props) {
  const { settings, updateSettings, history, notes, clearAllData } = useContext(SidekickContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    // Show brief feedback that data was cleared
    // Note: In a production app, you might want a toast notification here
  };

  const totalItems = history.length + notes.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-palette4 p-6 rounded-lg max-w-md w-full text-white">
        <h2 className="text-xl mb-4">Settings</h2>

        <label className="block mb-3">
          <span className="block text-sm mb-1">OpenAI API Key</span>
          <input
            type="password"
            className="w-full p-2 rounded bg-palette3"
            value={localSettings.apiKey}
            onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
          />
        </label>

        <label className="block mb-3">
          <span className="block text-sm mb-1">System Prompt</span>
          <textarea
            className="w-full p-2 rounded bg-palette3"
            rows={3}
            value={localSettings.systemPrompt}
            onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
          />
        </label>

        <label className="block mb-3">
          <span className="block text-sm mb-1">Voice</span>
          <select
            className="w-full p-2 rounded bg-palette3"
            value={localSettings.voiceId}
            onChange={(e) => setLocalSettings({ ...localSettings, voiceId: e.target.value })}
          >
            {[
              "alloy",
              "echo",
              "fable",
              "onyx",
              "nova",
              "shimmer",
              "sage",
            ].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localSettings.silent}
            onChange={(e) => setLocalSettings({ ...localSettings, silent: e.target.checked })}
          />
          <span>Silent Mode (text-only)</span>
        </label>

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localSettings.fastMode}
            onChange={(e) => setLocalSettings({ ...localSettings, fastMode: e.target.checked })}
          />
          <span>Premium Mode (gpt-4o-mini)</span>
        </label>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={!!localSettings.prewarm}
            onChange={(e) => setLocalSettings({ ...localSettings, prewarm: e.target.checked })}
          />
          <span>Pre-warm OpenAI APIs (reduces first-response latency)</span>
        </label>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={localSettings.debug}
            onChange={(e) => setLocalSettings({ ...localSettings, debug: e.target.checked })}
          />
          <span>Debug Mode</span>
        </label>

        {/* Clear History Section */}
        <div className="border-t border-palette3 pt-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 text-red-300">Data Management</h3>
          <p className="text-xs text-gray-300 mb-3">
            Clear all conversation history and note markers ({totalItems} items stored)
          </p>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
            onClick={() => setShowClearConfirm(true)}
            disabled={totalItems === 0}
          >
            Clear All History & Notes
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button className="bg-palette3 px-4 py-2 rounded text-white" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-palette1 text-palette4 px-4 py-2 rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-palette4 p-6 rounded-lg max-w-sm w-full text-white mx-4 border border-red-300">
            <h3 className="text-lg font-semibold mb-2 text-red-300">Clear All Data?</h3>
            <p className="text-sm text-gray-300 mb-4">
              This will permanently delete all {history.length} conversation messages and {notes.length} note markers. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="bg-palette3 px-3 py-2 rounded text-sm"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-semibold transition-colors"
                onClick={handleClearAll}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 