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
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "//unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: { str: string }) => item.str).join(" ") + "\n";
    }
    return text;
  };

  // Extract and update context from the current file list
  const updateContextFromFiles = async (fileList: File[]) => {
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
  };

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
    <div className="w-full h-full bg-white rounded-2xl shadow-lg p-6 border border-indigo-100 flex flex-col gap-6 ">
      <div className="flex flex-col md:flex-row gap-6 w-full h-full">
        {/* Upload column */}
        <div className="flex-1 flex flex-col gap-2 h-full">
          <label className="font-semibold text-indigo-700 mb-1 text-lg flex items-center gap-2">
            <span role="img" aria-label="upload">📤</span>
            Upload Files
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 shadow-sm ${
              isDragActive ? "border-violet-500 bg-violet-50" : "border-indigo-200 bg-white hover:bg-indigo-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📂</span>
              <span className="font-medium text-indigo-700">
                {isDragActive
                  ? "Drop the files here ..."
                  : "Drag & drop files here, or click to select"}
              </span>
              <div className="text-xs text-gray-500 mt-2">
                Supported: <span className="font-mono">.txt,.md,.docx,.pdf</span> <br/> &middot; Max 10MB/file &middot; Up to 5 files
              </div>
            </div>
          </div>
          {files.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {files.map((file, idx) => (
                <li
                  key={file.name + file.size}
                  className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded px-3 py-1 transition-all duration-200"
                >
                  <span className="truncate text-sm text-indigo-900 flex items-center gap-1">
                    <span role="img" aria-label="file">📄</span>
                    {file.name}
                  </span>
                  <button
                    className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    aria-label={`Remove ${file.name}`}
                    type="button"
                  >
                    <span role="img" aria-label="remove">❌</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileError && (
            <div className="text-red-600 text-sm mt-2 font-semibold flex items-center gap-1">
              <span role="img" aria-label="error">⚠️</span>
              {fileError}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 text-sm mt-2 animate-pulse">
              <span role="img" aria-label="loading">⏳</span>
              Extracting text from files...
            </div>
          )}
        </div>
        {/* Paste column */}
        <div className="flex-1 flex flex-col gap-2 h-full">
          <label className="font-semibold text-indigo-700 mb-1 text-lg flex items-center gap-2">
            <span role="img" aria-label="paste">📝</span>
            Paste Context
          </label>
          <textarea
            className="border-2 border-indigo-200 rounded-xl p-3 min-h-[220px] resize-y focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition text-base"
            placeholder="Paste conversation, social feed, or any context here..."
            value={text}
            onChange={handleTextChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ContextInput;
