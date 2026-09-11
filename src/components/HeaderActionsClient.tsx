"use client";
import { useRef } from "react";

interface HeaderActionsClientProps {
  isProcessing: boolean; dataSourceLine: string; processingLabel: string;
  importWarning: string | null; onLoadSample: () => void;
  onOpenSampleData: () => void; onOpenSampleFormat: () => void; onOpenDataUse: () => void;
  onUploadFile: (file: File) => void;
}
export function HeaderActionsClient({ isProcessing, dataSourceLine, processingLabel, importWarning, onLoadSample, onOpenSampleData, onOpenSampleFormat, onOpenDataUse, onUploadFile }: HeaderActionsClientProps) {
  const input = useRef<HTMLInputElement | null>(null);
  return <div className="header-actions">
    <div className="header-action-row"><div className="header-action-stack"><button className="primary-button" type="button" disabled={isProcessing} onClick={onLoadSample}>Load sample data</button><button className="sample-format-link" type="button" onClick={onOpenSampleData}>See sample data</button></div><div className="header-action-stack"><button className="primary-button" type="button" disabled={isProcessing} onClick={() => input.current?.click()}>Load your own data</button><button className="sample-format-link" type="button" onClick={onOpenSampleFormat}>Sample format</button></div>
      <input ref={input} className="file-input-hidden" type="file" aria-label="Choose transaction file" accept=".csv,.xls,.xlsx" onChange={e => { const file = e.target.files?.[0]; if (file) onUploadFile(file); e.target.value = ""; }} />
    </div>
    <p className="dataset-notice">{dataSourceLine}</p>
    <p className="upload-handling">Files are processed on the application server. <button type="button" onClick={onOpenDataUse}>How your data is used</button></p>
    {isProcessing && <div className="processing-panel" role="status"><strong>{processingLabel}</strong><div className="processing-bar-track" aria-hidden="true"><span className="processing-bar-fill is-indeterminate" /></div><p>Working… progress is not a measured percentage.</p></div>}
    {importWarning && <p className="import-warning" role="alert">{importWarning}</p>}
  </div>;
}
