// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useContext, useState, useMemo, useRef } from "react";
import { SidekickContext } from "../context/SidekickContext";
import { HistoryItem } from "../context/SidekickContext";
import { VariableSizeList as List } from "react-window";

async function downloadPdf(history: HistoryItem[]) {
  // @ts-ignore dynamic import types
  const [{ default: jsPDF }, autoTable] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  doc.text("Audiobook Sidekick – History", 14, 16);
  (autoTable as any).default(doc, {
    startY: 22,
    head: [["Time", "Role", "Content"]],
    body: history.map((h) => [h.timestamp, h.role, h.content]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [92, 93, 36] }, // palette3
  });
  doc.save("sidekick-history.pdf");
}

interface Props {
  onClose: () => void;
}

export default function HistoryDrawer({ onClose }: Props) {
  const { history } = useContext(SidekickContext);
  
  // Debug logging
  console.log('History drawer - total items:', history.length, history);

  // refs for dynamic sizing
  const listRef = useRef<any>(null);
  const sizeMap = useRef<{ [key: number]: number }>({});

  const [filter, setFilter] = useState<"all" | "notes" | "qa">("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return history;
    if (filter === "notes") return history.filter((h) => h.role === "note");
    return history.filter((h) => h.role !== "note");
  }, [filter, history]);

  const displayItems = showAll ? filtered : filtered.slice(-10);

  const roleClass = (role: string) => {
    switch (role) {
      case "user":
        return "bg-palette1 text-palette4";
      case "sidekick":
        return "bg-palette4 text-white";
      case "note":
        return "bg-palette3 text-white";
      default:
        return "bg-palette3 text-white";
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-palette4 max-h-3/4 overflow-y-auto p-4 rounded-t-2xl shadow-lg z-40 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">History</h2>
        <div className="flex gap-2">
          <button className="bg-palette1 text-palette4 px-2 py-1 rounded" onClick={() => downloadPdf(filtered)}>
            PDF
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-2 text-sm">
        {[
          { id: "all", label: "All" },
          { id: "notes", label: "Notes" },
          { id: "qa", label: "Q&A" },
        ].map((btn) => (
          <button
            key={btn.id}
            className={`px-2 py-1 rounded ${filter === btn.id ? "bg-palette1 text-palette4" : "bg-palette3"}`}
            onClick={() => setFilter(btn.id as any)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-palette1">No history yet.</p>}

      {displayItems.length > 0 && (
        <List
          height={window.innerHeight * 0.5}
          itemCount={displayItems.length}
          width="100%"
          itemSize={(index) => sizeMap.current[index] ?? 100}
          ref={listRef}
          className="space-y-2"
          itemData={{ items: displayItems, roleClass, sizeMap, listRef }}
        >
          {Row}
        </List>
      )}

      {filtered.length > 10 && (
        <div className="mt-3 text-center">
          <button
            className="text-sm underline"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show Recent" : `Show All (${filtered.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ index, style, data }: any) {
  const { items, roleClass, sizeMap, listRef } = data;
  const item = items[index];

  const measuredRef = (node: HTMLLIElement | null) => {
    if (node) {
      const height = node.getBoundingClientRect().height + 8; // margin
      if (sizeMap.current[index] !== height) {
        sizeMap.current[index] = height;
        listRef.current?.resetAfterIndex(index);
      }
    }
  };

  return (
    <li
      ref={measuredRef}
      style={{ ...style, height: "auto" }}
      className={`p-3 rounded ${roleClass(item.role)} m-1 break-words whitespace-pre-wrap`}
    >
      <p className="text-xs opacity-70 mb-1">{item.timestamp}</p>
      <p>{item.content}</p>
    </li>
  );
} 