import React, { useState, useCallback } from "react";
import type { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

interface ContextInputProps {
  onContextChange: (context: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const SUPPORTED_EXTS = ["txt", "md", "docx", "pdf"];

const ContextInput: React.FC<ContextInputProps> = ({ onContextChange }) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onContextChange(e.target.value);
  };

  const extractPdfText = async (file: File): Promise<string> => {
    // Set workerSrc for pdfjs (hardcoded to installed version)
    (pdfjsLib as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = "//unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as { getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (pageNum: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str: string }> }> }> }> } }).getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: { str: string }) => item.str).join(" ") + "\n";
    }
    return text;
  };

  // Extract and update context from the current file list
  const updateContextFromFiles = useCallback(async (fileList: File[]) => {
    setFileError(null);
    setLoading(true);
    let allText = "";
    for (const file of fileList) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "txt" || ext === "md") {
        const fileText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => reject();
          reader.readAsText(file);
        });
        allText += fileText + "\n";
      } else if (ext === "docx") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          allText += result.value + "\n";
        } catch {
          setFileError(`Failed to extract text from "${file.name}".`);
          setLoading(false);
          return;
        }
      } else if (ext === "pdf") {
        try {
          const pdfText = await extractPdfText(file);
          allText += pdfText + "\n";
        } catch {
          setFileError(`Failed to extract text from "${file.name}".`);
          setLoading(false);
          return;
        }
      }
    }
    setText(allText.trim());
    onContextChange(allText.trim());
    setLoading(false);
  }, [onContextChange]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFileError(null);

      let newFiles = [...files, ...acceptedFiles];
      // Remove duplicates by name and size
      newFiles = newFiles.filter(
        (file, idx, arr) =>
          arr.findIndex(
            (f) => f.name === file.name && f.size === file.size
          ) === idx
      );

      if (newFiles.length > MAX_FILES) {
        setFileError(`You can upload up to ${MAX_FILES} files.`);
        return;
      }

      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`File "${file.name}" exceeds 10MB size limit.`);
          return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (!SUPPORTED_EXTS.includes(ext)) {
          setFileError(
            `Unsupported file type: "${file.name}". Please upload .txt, .md, .docx, or .pdf files.`
          );
          return;
        }
      }

      setFiles(newFiles);
      await updateContextFromFiles(newFiles);
    },
    [files, updateContextFromFiles]
  );

  const removeFile = async (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    await updateContextFromFiles(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    maxFiles: MAX_FILES,
  });

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl p-6 border border-purple-400/20 backdrop-blur-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Upload column */}
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-purple-300 text-lg flex items-center gap-2">
            <span className="text-2xl">📤</span>
            Upload Context Files
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? "border-purple-400 bg-purple-500/20 scale-105" 
                : "border-purple-400/40 bg-white/5 hover:bg-white/10 hover:border-purple-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">📂</span>
              <span className="font-medium text-purple-200">
                {isDragActive
                  ? "Drop the files here ..."
                  : "Drag & drop files here, or click to select"}
              </span>
              <div className="text-xs text-purple-400 mt-2 bg-purple-900/30 px-3 py-2 rounded-lg">
                <div className="font-mono">.txt • .md • .docx • .pdf</div>
                <div className="mt-1">Max 10MB/file • Up to 5 files</div>
              </div>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-purple-300 text-sm font-medium">
                📁 {files.length} file{files.length !== 1 ? 's' : ''} uploaded
              </div>
              <ul className="space-y-2">
                {files.map((file, idx) => (
                  <li
                    key={file.name + file.size}
                    className="flex items-center justify-between bg-purple-800/30 border border-purple-400/20 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-purple-700/40"
                  >
                    <span className="truncate text-sm text-purple-200 flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      {file.name}
                    </span>
                    <button
                      className="p-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all duration-200 transform hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      aria-label={`Remove ${file.name}`}
                      type="button"
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {fileError && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-300 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span>
                {fileError}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-300 text-sm animate-pulse">
                <span className="text-lg">⏳</span>
                Extracting text from files...
              </div>
            </div>
          )}
        </div>
        
        {/* Paste column */}
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-purple-300 text-lg flex items-center gap-2">
            <span className="text-2xl">📝</span>
            Paste Context Directly
          </label>
          <textarea
            className="bg-white/10 border-2 border-purple-400/30 rounded-xl p-4 min-h-[280px] text-white placeholder-purple-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition backdrop-blur-sm resize-y"
            placeholder="Paste conversation, social feed, trending topics, or any context here..."
            value={text}
            onChange={handleTextChange}
          />
          <div className="text-purple-400 text-xs bg-purple-900/20 px-3 py-2 rounded-lg">
            💡 This context will be used to generate relevant charade topics
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextInput;
