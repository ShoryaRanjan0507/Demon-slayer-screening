import React, { useState } from 'react';
import { 
  X, Users, Upload, Link as LinkIcon, FileSpreadsheet, 
  Search, Download, CheckCircle2, AlertCircle, RefreshCw, 
  FileText, Sparkles, Plus, ExternalLink, ArrowRight, Shield, Key
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { importParticipantsBatch, exportParticipantsToCsv } from '../utils/storage';

export default function ParticipantsModal({ 
  isOpen, 
  onClose, 
  registeredViewers, 
  onUpdateViewers,
  isOrganiserAuthenticated = false,
  onAuthenticateOrganiser
}) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'file', 'link', 'paste'
  const [searchTerm, setSearchTerm] = useState('');

  // Organiser PIN Auth State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  const isAuthenticated = isOrganiserAuthenticated || isLocalAuth;

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === 'anime2026' || pinInput.trim() === 'admin') {
      setIsLocalAuth(true);
      setPinError(false);
      if (onAuthenticateOrganiser) onAuthenticateOrganiser();
    } else {
      setPinError(true);
    }
  };

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [parsedPreview, setParsedPreview] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importStatus, setImportStatus] = useState(null); // { type: 'success'|'error', msg: string }

  // Google Sheet Link State
  const [sheetUrl, setSheetUrl] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);

  // Paste Text State
  const [pasteText, setPasteText] = useState('');

  if (!isOpen) return null;

  // Filtered viewers for Directory tab
  const filteredViewers = registeredViewers.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.rollNo?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q)
    );
  });

  // Helper to parse file using XLSX
  const handleFileChange = (file) => {
    if (!file) return;
    setFileName(file.name);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonRows.length === 0) {
          setImportStatus({ type: 'error', msg: 'The selected file is empty or contains no readable table data.' });
          setParsedPreview([]);
          return;
        }

        setParsedPreview(jsonRows);
      } catch (err) {
        console.error("Parse file error:", err);
        setImportStatus({ type: 'error', msg: 'Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmFileImport = () => {
    if (parsedPreview.length === 0) return;
    const result = importParticipantsBatch(parsedPreview);
    onUpdateViewers();
    setImportStatus({ 
      type: 'success', 
      msg: `Successfully imported! Added ${result.addedCount} new participants, updated ${result.updatedCount} existing records.` 
    });
    setParsedPreview([]);
    setFileName('');
  };

  // Helper to convert standard Google Sheet URL to CSV export URL
  const convertGoogleSheetUrlToCsv = (url) => {
    let cleanUrl = url.trim();
    if (cleanUrl.includes('docs.google.com/spreadsheets')) {
      const matches = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        const docId = matches[1];
        // Check for specific gid
        const gidMatch = cleanUrl.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
        return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv${gidParam}`;
      }
    }
    return cleanUrl;
  };

  const handleFetchSheetLink = async () => {
    if (!sheetUrl.trim()) return;
    setIsFetchingSheet(true);
    setImportStatus(null);

    const csvExportUrl = convertGoogleSheetUrlToCsv(sheetUrl);

    try {
      const res = await fetch(csvExportUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const csvText = await res.text();

      // Parse CSV using XLSX
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (jsonRows.length === 0) {
        setImportStatus({ type: 'error', msg: 'No participant rows found in the fetched Google Sheet.' });
      } else {
        setParsedPreview(jsonRows);
        setImportStatus({ type: 'success', msg: `Fetched ${jsonRows.length} rows from Google Sheet! Click "Confirm Import" below to add them.` });
      }
    } catch (err) {
      console.error("Fetch sheet error:", err);
      setImportStatus({ 
        type: 'error', 
        msg: 'Could not fetch Google Sheet directly. Make sure your Google Sheet is set to "Anyone with the link can view", or use the Excel/CSV file upload option.' 
      });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    try {
      const workbook = XLSX.read(pasteText, { type: 'string' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      if (jsonRows.length === 0) {
        setImportStatus({ type: 'error', msg: 'Could not detect participant rows in pasted text.' });
        return;
      }
      const result = importParticipantsBatch(jsonRows);
      onUpdateViewers();
      setImportStatus({ 
        type: 'success', 
        msg: `Successfully imported ${result.addedCount} new participants from pasted text!` 
      });
      setPasteText('');
    } catch (e) {
      setImportStatus({ type: 'error', msg: 'Failed to process pasted spreadsheet text.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-red-500/40 bg-[#0c0919] p-6 shadow-2xl animate-popup text-gray-100 overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-red-950/60 hover:text-white transition hover-zoom"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Organiser PIN Authentication Protection Step */}
        {!isAuthenticated ? (
          <div className="py-10 text-center max-w-sm mx-auto animate-zoomin my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950 border border-amber-500/50 text-amber-400 mb-4 animate-zoomin shadow-lg">
              <Shield className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black text-white">Organiser Access Required</h3>
            <p className="text-xs text-gray-400 mt-1">Enter your Anime Club Organiser PIN code to access participant list & Excel/Sheet importer</p>

            <form onSubmit={handlePinSubmit} className="mt-6 space-y-3">
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-400" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (Default: anime2026)"
                  className="w-full rounded-xl border border-amber-900/60 bg-black/80 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {pinError && <p className="text-xs text-red-400 font-semibold animate-popup">Incorrect PIN. Try: anime2026</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 shadow-lg hover-zoom"
              >
                Unlock Organiser Importer
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Organiser Content */
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-red-950/80 pb-4 shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-950/80">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white sm:text-2xl">Participants Directory & Sheet Importer</h2>
                  <span className="rounded-full bg-red-950 border border-red-500/40 px-2.5 py-0.5 text-xs font-bold text-red-300">
                    {registeredViewers.length} Registered
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Access participant list, import Excel (.xlsx/.xls/.csv) files, or sync live Google Form Sheets
                </p>
              </div>
            </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-red-950/80 py-3 my-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition hover-zoom ${activeTab === 'directory' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-red-950/30'}`}
          >
            <Users className="h-4 w-4" /> Participants List ({registeredViewers.length})
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition hover-zoom ${activeTab === 'file' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-red-950/30'}`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Upload Excel / CSV File
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition hover-zoom ${activeTab === 'link' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-red-950/30'}`}
          >
            <LinkIcon className="h-4 w-4 text-amber-400" /> Google Sheet Link
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition hover-zoom ${activeTab === 'paste' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow' : 'bg-black/40 text-gray-400 hover:text-white hover:bg-red-950/30'}`}
          >
            <FileText className="h-4 w-4 text-sky-400" /> Paste Raw Data
          </button>
        </div>

        {/* Global Import Notification Banner */}
        {importStatus && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 mb-3 animate-popup ${importStatus.type === 'success' ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300' : 'border-red-500/50 bg-red-950/50 text-red-300'}`}>
            <div className="flex items-center gap-2">
              {importStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
              <span>{importStatus.msg}</span>
            </div>
            <button onClick={() => setImportStatus(null)} className="text-gray-400 hover:text-white text-xs ml-2">✕</button>
          </div>
        )}

        {/* TAB 1: Participants Directory */}
        {activeTab === 'directory' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search participants by Name, Email, Roll No, or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-red-900/60 bg-black/60 py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2 text-xs text-gray-500 hover:text-white">✕</button>
                )}
              </div>

              <button
                onClick={() => exportParticipantsToCsv(registeredViewers)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 hover-zoom shrink-0"
              >
                <Download className="h-4 w-4" /> Export Participants CSV
              </button>
            </div>

            {/* Participants Table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-red-950/80 bg-black/40 p-1">
              {filteredViewers.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No participants matched your search term "{searchTerm}".
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#120e24] text-gray-400 border-b border-red-950/80">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Full Name</th>
                      <th className="py-2.5 px-3 font-bold">Email Address</th>
                      <th className="py-2.5 px-3 font-bold">Registration No</th>
                      <th className="py-2.5 px-3 font-bold">Phone</th>
                      <th className="py-2.5 px-3 font-bold text-right">Form Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-950/40 font-mono text-[11px]">
                    {filteredViewers.map((v, i) => (
                      <tr key={v.id || i} className="hover:bg-red-950/20 transition">
                        <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                        <td className="py-2 px-3 font-sans font-bold text-white">{v.name}</td>
                        <td className="py-2 px-3 text-red-300">{v.email}</td>
                        <td className="py-2 px-3 text-amber-400">{v.rollNo || 'N/A'}</td>
                        <td className="py-2 px-3 text-gray-300">{v.phone || 'N/A'}</td>
                        <td className="py-2 px-3 text-right text-gray-500">{v.formTimestamp || 'Pre-seeded'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Upload Excel / CSV File */}
        {activeTab === 'file' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fadeIn">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center shrink-0 ${dragActive ? 'border-orange-500 bg-orange-950/20' : 'border-red-900/60 bg-black/40 hover:border-red-500/50'}`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .tsv"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="h-10 w-10 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-white">Drag & drop your Excel file (.xlsx, .xls, .csv)</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse from computer</p>
              <span className="mt-3 inline-block text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-full">
                Supports Google Form exported sheets with Email, Name, Roll No columns
              </span>
            </div>

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-emerald-400">
                    File: {fileName} — Detected {parsedPreview.length} participant rows:
                  </span>
                  <button
                    onClick={handleConfirmFileImport}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 hover-zoom shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirm & Import {parsedPreview.length} Participants
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl border border-red-950/80 bg-black/60 p-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#120e24] text-gray-400">
                      <tr>
                        <th className="py-2 px-3 font-bold">#</th>
                        {Object.keys(parsedPreview[0] || {}).slice(0, 5).map((col, idx) => (
                          <th key={idx} className="py-2 px-3 font-bold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-950/40 font-mono text-[11px]">
                      {parsedPreview.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-red-950/20">
                          <td className="py-1.5 px-3 text-gray-500">{rIdx + 1}</td>
                          {Object.keys(parsedPreview[0] || {}).slice(0, 5).map((col, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-3 text-gray-200">{String(row[col] || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedPreview.length > 50 && (
                    <p className="text-[10px] text-gray-500 text-center py-2">Showing first 50 rows preview...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Fetch Live Google Sheet Link */}
        {activeTab === 'link' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fadeIn">
            <div className="rounded-2xl border border-amber-900/60 bg-black/40 p-4 space-y-3 shrink-0">
              <label className="block text-xs font-bold text-amber-300">
                Google Sheet Share URL or CSV Link:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit#gid=0"
                    className="w-full rounded-xl border border-amber-900/60 bg-black py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleFetchSheetLink}
                  disabled={isFetchingSheet || !sheetUrl.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-bold uppercase text-black hover:brightness-110 disabled:opacity-50 hover-zoom shrink-0"
                >
                  {isFetchingSheet ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {isFetchingSheet ? 'Fetching Sheet...' : 'Fetch Live Sheet'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                💡 <strong>Tip:</strong> You can paste standard Google Sheet links directly. Make sure the Google Sheet sharing permission is set to <em>"Anyone with the link can view"</em>.
              </p>
            </div>

            {/* Parsed Preview Table for Sheet Link */}
            {parsedPreview.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-amber-400">
                    Fetched {parsedPreview.length} rows from link:
                  </span>
                  <button
                    onClick={handleConfirmFileImport}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 hover-zoom shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirm & Import {parsedPreview.length} Participants
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl border border-red-950/80 bg-black/60 p-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#120e24] text-gray-400">
                      <tr>
                        <th className="py-2 px-3 font-bold">#</th>
                        {Object.keys(parsedPreview[0] || {}).slice(0, 5).map((col, idx) => (
                          <th key={idx} className="py-2 px-3 font-bold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-950/40 font-mono text-[11px]">
                      {parsedPreview.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-red-950/20">
                          <td className="py-1.5 px-3 text-gray-500">{rIdx + 1}</td>
                          {Object.keys(parsedPreview[0] || {}).slice(0, 5).map((col, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-3 text-gray-200">{String(row[col] || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Paste Raw Text */}
        {activeTab === 'paste' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-fadeIn">
            <p className="text-xs text-gray-300">
              Paste comma-separated or tab-separated text copied directly from Google Sheets or Excel (<code>Email, Name, Registration No</code>):
            </p>
            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Email Address, Full Name, Registration No&#10;tanjiro@demonslayer.club, Tanjiro Kamado, DS-101&#10;nezuko@demonslayer.club, Nezuko Kamado, DS-102"
              className="flex-1 w-full rounded-xl border border-red-900/60 bg-black/60 p-3 text-xs font-mono text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
            />
            <button
              onClick={handlePasteImport}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 py-2.5 text-xs font-bold uppercase text-white hover:brightness-110 hover-zoom"
            >
              <Plus className="h-4 w-4" /> Parse & Add to Participants List
            </button>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
}
