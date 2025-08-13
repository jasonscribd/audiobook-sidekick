import { useContext, useState } from "react";
import { SidekickContext } from "../context/SidekickContext";

interface Props {
  onClose: () => void;
}

export default function SettingsPane({ onClose }: Props) {
  const { settings, updateSettings } = useContext(SidekickContext);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

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
          <span>Fast Mode (gpt-3.5-turbo-mini)</span>
        </label>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={localSettings.debug}
            onChange={(e) => setLocalSettings({ ...localSettings, debug: e.target.checked })}
          />
          <span>Debug Mode</span>
        </label>

        <div className="flex justify-end gap-2">
          <button className="bg-palette3 px-4 py-2 rounded text-white" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-palette1 text-palette4 px-4 py-2 rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 