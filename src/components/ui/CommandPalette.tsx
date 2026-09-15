"use client";

import { useState, useEffect, useMemo, useRef, type FC } from "react";
import { useRouter } from "next/navigation";
import { SECTOR_DEFINITIONS } from "../../domain/sectors-dataset";
import { IconSearch } from "./Icons";
import type { Route } from "next";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRoleChange?: (role: "analyst" | "operator" | "admin") => void;
}

interface CommandItem {
  id: string;
  category: "Navigation" | "Sectors" | "Companies" | "Actions";
  title: string;
  subtitle?: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: FC<Props> = ({ isOpen, onClose, onRoleChange }) => {
  if (!isOpen) return null;
  return <CommandPaletteModal onClose={onClose} onRoleChange={onRoleChange} />;
};

interface ModalProps {
  onClose: () => void;
  onRoleChange?: (role: "analyst" | "operator" | "admin") => void;
}

const CommandPaletteModal: FC<ModalProps> = ({ onClose, onRoleChange }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list
  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      // Navigation
      {
        id: "nav-overview",
        category: "Navigation",
        title: "Overview Pulse",
        subtitle: "Macroeconomic early-warning pulse",
        shortcut: "G O",
        action: () => { router.push("/" as Route); onClose(); },
      },
      {
        id: "nav-radar",
        category: "Navigation",
        title: "Sector Radar",
        subtitle: "Explore all 5 sector cohorts & financial shifts",
        shortcut: "G R",
        action: () => { router.push("/radar" as Route); onClose(); },
      },
      {
        id: "nav-investigations",
        category: "Navigation",
        title: "Investigations Workspace",
        subtitle: "Bounded AI economic inquiry feed",
        shortcut: "G I",
        action: () => { router.push("/investigations" as Route); onClose(); },
      },
      {
        id: "nav-briefs",
        category: "Navigation",
        title: "Decision Briefs",
        subtitle: "Versioned deliverables & markdown export",
        shortcut: "G B",
        action: () => { router.push("/briefs" as Route); onClose(); },
      },
      {
        id: "nav-data",
        category: "Navigation",
        title: "Data & Method Transparency",
        subtitle: "Method v0.1 spec, sources, and SHA-256 hashes",
        shortcut: "G D",
        action: () => { router.push("/data" as Route); onClose(); },
      },

      // Sectors
      {
        id: "sec-nickel",
        category: "Sectors",
        title: "Basic Materials — Nickel & Minerals",
        subtitle: "Mixed Signal (Risk 50 / Opp 50) · 5 Constituents",
        action: () => { router.push("/radar/run-basic-materials-2026-03-31/basic-materials" as Route); onClose(); },
      },
      {
        id: "sec-logistics",
        category: "Sectors",
        title: "Industrial — Logistics & Transport",
        subtitle: "Opportunity Signal (Opp 75.0) · 4 Constituents",
        action: () => { router.push("/radar/run-industrial-logistics-2026-03-31/industrial-logistics" as Route); onClose(); },
      },
      {
        id: "sec-telco",
        category: "Sectors",
        title: "Telecommunications & Digital Infrastructure",
        subtitle: "Insufficient Data (<60% coverage) · 3 Constituents",
        action: () => { router.push("/radar/run-telecommunications-2026-03-31/telecommunications" as Route); onClose(); },
      },
    ];

    // Constituents
    SECTOR_DEFINITIONS.forEach((sector) => {
      sector.companies.forEach((co) => {
        items.push({
          id: `co-${co.symbol}`,
          category: "Companies",
          title: `${co.symbol} — ${co.name}`,
          subtitle: `In ${sector.name} (${co.marketCapCategory})`,
          action: () => {
            router.push(`/radar/run-${sector.id}-2026-03-31/${sector.id}` as Route);
            onClose();
          },
        });
      });
    });

    // Session Role Switcher
    if (onRoleChange) {
      items.push(
        {
          id: "role-analyst",
          category: "Actions",
          title: "Switch Session to Analyst (Policy)",
          subtitle: "Standard policy analyst permissions",
          action: () => { onRoleChange("analyst"); onClose(); },
        },
        {
          id: "role-operator",
          category: "Actions",
          title: "Switch Session to Operator (Data Ops)",
          subtitle: "Data ingestion & trigger capabilities",
          action: () => { onRoleChange("operator"); onClose(); },
        },
        {
          id: "role-admin",
          category: "Actions",
          title: "Switch Session to System Admin",
          subtitle: "Full methodology & governance audit control",
          action: () => { onRoleChange("admin"); onClose(); },
        }
      );
    }

    return items;
  }, [router, onClose, onRoleChange]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 12);
    const q = query.toLowerCase();
    return commands.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Focus input when opened
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command Palette">
      <div className="command-palette-card" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-palette-input-wrapper">
          <span style={{ color: "var(--slate-400)", marginRight: "10px", display: "flex", alignItems: "center" }} aria-hidden="true">
            <IconSearch size={18} />
          </span>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search sectors, IDX tickers (e.g. AADI), pages, or switch roles..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        {/* Results List */}
        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--slate-500)", fontSize: "0.875rem" }}>
              No matches found for “{query}”
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`command-item ${isSelected ? "selected" : ""}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.action}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <span className="command-category-tag">{item.category}</span>
                    <div>
                      <div className="command-title">{item.title}</div>
                      {item.subtitle && <div className="command-subtitle">{item.subtitle}</div>}
                    </div>
                  </div>
                  {item.shortcut && (
                    <span className="kbd-shortcut">{item.shortcut}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="command-palette-footer">
          <span><kbd className="kbd-key">↑</kbd> <kbd className="kbd-key">↓</kbd> to navigate</span>
          <span><kbd className="kbd-key">↵</kbd> to select</span>
          <span><kbd className="kbd-key">esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
