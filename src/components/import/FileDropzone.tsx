"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  onFileLoad: (content: string, filename: string) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileLoad, disabled }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          onFileLoad(content, file.name);
        }
      };
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && /\.ya?ml$/i.test(file.name)) {
        readFile(file);
      }
    },
    [readFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        readFile(file);
      }
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [readFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".yaml,.yml"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-sm text-muted-foreground mb-2">
        Drag and drop a <code>.yaml</code> file here, or
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Choose File
      </Button>
    </div>
  );
}
