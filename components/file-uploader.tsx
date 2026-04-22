"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Copy,
  FileIcon,
  ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

type UploadedFile = {
  name: string;
  url: string;
  size: number;
  type: string;
};

type PendingFile = {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  url?: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="shrink-0 p-1.5 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
      title="Copy URL"
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export function FileUploader() {
  const { edgestore } = useEdgeStore();
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newPending: PendingFile[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading",
      }));

      setPending((prev) => [...prev, ...newPending]);

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const globalIndex = pending.length + i;

        try {
          const res = await edgestore.publicFiles.upload({
            file,
            onProgressChange: (progress) => {
              setPending((prev) =>
                prev.map((p, idx) =>
                  idx === globalIndex ? { ...p, progress } : p
                )
              );
            },
          });

          setPending((prev) =>
            prev.map((p, idx) =>
              idx === globalIndex
                ? { ...p, status: "done", url: res.url, progress: 100 }
                : p
            )
          );

          setUploaded((prev) => [
            {
              name: file.name,
              url: res.url,
              size: file.size,
              type: file.type,
            },
            ...prev,
          ]);
        } catch {
          setPending((prev) =>
            prev.map((p, idx) =>
              idx === globalIndex ? { ...p, status: "error" } : p
            )
          );
        }
      }

      setTimeout(() => {
        setPending((prev) => prev.filter((p) => p.status !== "done"));
      }, 1500);
    },
    [edgestore, pending.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-start px-4 py-16 gap-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Drop your files
        </h1>
        <p className="text-zinc-500 text-base">
          Upload anything — get a shareable link instantly.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative w-full max-w-xl rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-12 flex flex-col items-center gap-4
          ${
            isDragActive
              ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
              : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900"
          }`}
      >
        <input {...getInputProps()} />

        <div
          className={`p-4 rounded-full transition-colors duration-300 ${
            isDragActive ? "bg-violet-500/20" : "bg-zinc-800"
          }`}
        >
          <UploadCloud
            className={`w-8 h-8 transition-colors duration-300 ${
              isDragActive ? "text-violet-400" : "text-zinc-400"
            }`}
          />
        </div>

        <div className="text-center">
          <p className="text-white font-medium text-base">
            {isDragActive ? "Release to upload" : "Drag & drop files here"}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            or{" "}
            <span className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>
      </div>

      {/* Uploading */}
      {pending.length > 0 && (
        <div className="w-full max-w-xl space-y-3">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Uploading
          </p>
          {pending.map((p, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {p.file.type.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 text-violet-400 shrink-0" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                  <span className="text-white text-sm truncate">
                    {p.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-zinc-500 text-xs">
                    {formatBytes(p.file.size)}
                  </span>
                  {p.status === "uploading" ? (
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  ) : p.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              <Progress
                value={p.progress}
                className="h-1.5 bg-zinc-800 [&>div]:bg-violet-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files */}
      {uploaded.length > 0 && (
        <div className="w-full max-w-xl space-y-3">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
            Uploaded — {uploaded.length} file{uploaded.length > 1 ? "s" : ""}
          </p>
          {uploaded.map((f, i) => (
            <div
              key={i}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {f.type.startsWith("image/") ? (
                  <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.url}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">
                      {f.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs bg-zinc-800 text-zinc-400 border-0"
                    >
                      {formatBytes(f.size)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 text-xs truncate transition-colors"
                    >
                      {f.url}
                    </a>
                    <CopyButton text={f.url} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploaded.length === 0 && pending.length === 0 && (
        <p className="text-zinc-600 text-sm">No files uploaded yet.</p>
      )}

      {uploaded.length > 0 && (
        <Button
          variant="ghost"
          className="text-zinc-600 hover:text-zinc-400 text-sm"
          onClick={() => setUploaded([])}
        >
          Clear list
        </Button>
      )}
    </div>
  );
}
