"use client";

import { Button } from "@/components/ui/button";

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function YamlEditor({ value, onChange, disabled }: YamlEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">YAML Content</label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {value.length} chars
          </span>
          {value.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your YAML service definition here..."
        className="w-full min-h-[300px] rounded-md border bg-muted/50 p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        spellCheck={false}
      />
    </div>
  );
}
