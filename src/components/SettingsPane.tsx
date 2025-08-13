import { useContext, useState, useRef } from "react";
import { SidekickContext, BookContext } from "../context/SidekickContext";

interface Props {
  onClose: () => void;
}

export default function SettingsPane({ onClose }: Props) {
  const { settings, updateSettings, getCurrentBookContext, saveBookContext } = useContext(SidekickContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [bookContext, setBookContext] = useState(() => getCurrentBookContext()?.bookContextMarkdown || "");
  const [contextSize, setContextSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings(localSettings);
    
    // Save book context if changed
    if (bookContext.trim()) {
      saveBookContext(settings.currentBookId, {
        bookContextMarkdown: bookContext.trim(),
        updatedAt: Date.now(),
      });
    }
    
    onClose();
  };

  const handleContextChange = (value: string) => {
    setBookContext(value);
    setContextSize(value.length);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/markdown" || file.name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleContextChange(content);
      };
      reader.readAsText(file);
    } else if (file) {
      alert("Please select a .md (Markdown) file");
    }
  };

  const formatSize = (chars: number): string => {
    if (chars < 1000) return `${chars} chars`;
    if (chars < 300000) return `${Math.round(chars / 1000)}k chars`;
    return `${Math.round(chars / 1000000)}M chars`;
  };

  const getSizeWarning = (chars: number): string | null => {
    if (chars > 300000) return "⚠️ Very large context - consider trimming for better performance";
    if (chars > 100000) return "Large context - may impact response time";
    return null;
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

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localSettings.debug}
            onChange={(e) => setLocalSettings({ ...localSettings, debug: e.target.checked })}
          />
          <span>Debug Mode</span>
        </label>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={localSettings.useBookContext}
            onChange={(e) => setLocalSettings({ ...localSettings, useBookContext: e.target.checked })}
          />
          <span>Use book context when answering</span>
        </label>

        {/* Book Context Section */}
        <div className="mb-4 p-4 bg-palette3 rounded">
          <h3 className="text-lg mb-2">Book Context</h3>
          <p className="text-sm text-gray-300 mb-3">
            Context for: <strong>{settings.currentBookTitle}</strong>
          </p>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Paste Markdown context:</span>
              <div className="text-xs text-gray-400">
                {formatSize(bookContext.length)}
                {getSizeWarning(bookContext.length) && (
                  <div className="text-yellow-400 mt-1">
                    {getSizeWarning(bookContext.length)}
                  </div>
                )}
              </div>
            </div>
            <textarea
              className="w-full p-2 rounded bg-palette4 text-white text-sm font-mono"
              rows={6}
              placeholder="Paste Treasure Island context markdown here..."
              value={bookContext}
              onChange={(e) => handleContextChange(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              className="bg-palette1 text-palette4 px-3 py-1 rounded text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload .md File
            </button>
            <button
              type="button"
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleContextChange("")}
            >
              Clear
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {!bookContext.trim() && localSettings.useBookContext && (
            <p className="text-yellow-400 text-xs">
              No context loaded for this book.
            </p>
          )}
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
    </div>
  );
} 