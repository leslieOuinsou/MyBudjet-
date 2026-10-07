import React, { useState, useRef } from "react";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { Link } from "react-router-dom";
import { MdSwapVert, MdFolderOpen, MdCloudUpload, MdCloudDownload, MdDescription, MdErrorOutline, MdCheckCircle, MdTableChart, MdPictureAsPdf, MdGridOn, MdAssessment } from "react-icons/md";
import { 
  importTransactions, 
  exportTransactionsCSV, 
  exportTransactionsExcel, 
  exportTransactionsPDF, 
  exportFinancialReport,
  downloadBlob,
  downloadText,
  uploadDocument
} from '../api.js';

export default function ImportExportPage() {
  const [importFormat, setImportFormat] = useState("csv");
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [includePending, setIncludePending] = useState(false);
  
  // États de l'interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Référence pour l'input file
  const fileInputRef = useRef(null);

  // Gestion du drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Validation du fichier
  const validateFile = (file) => {
    if (importFormat === 'document') {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) throw new Error('Format invalide. Importez un PDF, JPG, PNG ou WebP.');
      if (file.size > 4 * 1024 * 1024) throw new Error('Le document dépasse 4 Mo.');
      return;
    }
    const allowedTypes = {
      csv: ['text/csv', 'application/csv', 'text/plain'],
      excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      pdf: ['application/pdf']
    };

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (maximum 10MB)');
    }

    const formatTypes = allowedTypes[importFormat.toLowerCase()] || [];
    if (formatTypes.length > 0 && !formatTypes.includes(file.type)) {
      // Vérification par extension si le type MIME n'est pas reconnu
      const extension = file.name.split('.').pop().toLowerCase();
      const validExtensions = {
        csv: ['csv'],
        excel: ['xlsx', 'xls'],
        pdf: ['pdf']
      };
      
      if (!validExtensions[importFormat.toLowerCase()]?.includes(extension)) {
        throw new Error(`Format de fichier invalide. Format attendu : ${importFormat.toUpperCase()}`);
      }
    }
  };

  // Import des données
  const handleImport = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier à importer');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setImportResults(null);
      setUploadProgress(0);
      
      // Validation du fichier
      validateFile(selectedFile);
      
      // Simulation du progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      if (importFormat === 'document') {
        clearInterval(progressInterval);
        await uploadDocument(selectedFile, { category: 'autre' });
        setUploadProgress(100);
        setSuccess('Document importé ! Retrouvez-le dans « Mes documents ».');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => { setSuccess(''); setUploadProgress(0); }, 5000);
        return;
      }

      const result = await importTransactions(selectedFile, importFormat);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setImportResults(result);
      setSuccess(`Import réussi ! ${result.imported} transactions importées${result.errors ? `, ${result.errors} erreurs` : ''}.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setSuccess('');
        setUploadProgress(0);
      }, 5000);
    } catch (err) {
      console.error('❌ Erreur import:', err);
      let errorMessage = 'Erreur lors de l\'import des données';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response) {
        // Si c'est une erreur HTTP avec réponse
        try {
          const errorData = await err.response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `Erreur ${err.response.status}: ${err.response.statusText}`;
        }
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Export des données
  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        startDate: dateFrom,
        endDate: dateTo,
        includePending: includePending
      };

      let result;
      let filename;
      
      switch (exportFormat) {
        case 'csv':
          result = await exportTransactionsCSV(params);
          filename = `transactions_${dateFrom}_${dateTo}.csv`;
          downloadText(result, filename);
          break;
        case 'excel':
          result = await exportTransactionsExcel(params);
          filename = `transactions_${dateFrom}_${dateTo}.xlsx`;
          downloadBlob(result, filename);
          break;
        case 'pdf':
          result = await exportTransactionsPDF(params);
          filename = `transactions_${dateFrom}_${dateTo}.pdf`;
          downloadBlob(result, filename);
          break;
        default:
          throw new Error('Format d\'export non supporté');
      }
      
      setSuccess('Export réussi ! Le fichier a été téléchargé.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export des données');
    } finally {
      setLoading(false);
    }
  };

  // Export du rapport financier
  const handleExportReport = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        period: 'custom',
        startDate: dateFrom,
        endDate: dateTo
      };

      const result = await exportFinancialReport(params);
      const filename = `rapport_financier_${dateFrom}_${dateTo}.pdf`;
      downloadBlob(result, filename);
      
      setSuccess('Rapport financier exporté avec succès !');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export du rapport');
    } finally {
      setLoading(false);
    }
  };

  const INPUT = 'w-full border border-gray-200 dark:border-[#334155] rounded-xl px-4 py-2.5 bg-white dark:bg-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40';
  const FORMATS = [
    { id: 'csv', label: 'CSV', icon: MdTableChart },
    { id: 'excel', label: 'Excel', icon: MdGridOn },
    { id: 'pdf', label: 'PDF', icon: MdPictureAsPdf },
  ];
  const importFormats = [FORMATS[0], FORMATS[1], { id: 'document', label: 'Document PDF', icon: MdPictureAsPdf }];
  const FormatPicker = ({ value, onChange, options }) => (
    <div className="grid grid-cols-3 gap-2" role="radiogroup">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${value === id ? 'border-[#2563EB] bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE]' : 'border-gray-200 dark:border-[#334155] text-gray-600 dark:text-[#CBD5E1] hover:border-[#2563EB]'}`}
        >
          <Icon className="text-2xl" /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-5 md:p-10 space-y-6 max-w-6xl">
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdSwapVert /></span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Importer et exporter des données</h1>
              <p className="text-white/85 text-sm mt-1">Récupérez vos transactions depuis un fichier, ou téléchargez-les en CSV, Excel ou PDF.</p>
            </div>
          </header>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-[#7F1D1D]/30 border border-red-200 dark:border-[#7F1D1D] text-red-700 dark:text-[#FCA5A5] rounded-xl text-sm">
              <MdErrorOutline className="text-xl shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-[#14532D]/30 border border-green-200 dark:border-[#166534] text-green-700 dark:text-[#4ADE80] rounded-xl text-sm">
              <MdCheckCircle className="text-xl shrink-0" /> {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Importer */}
            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-[#1E40AF]/50 text-blue-600 dark:text-[#BFDBFE] flex items-center justify-center text-xl"><MdCloudUpload /></span>
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">Importer des données</h2>
              </div>
              <p className="text-gray-500 dark:text-[#94A3B8] text-sm mb-5">Importez vos transactions depuis un fichier CSV ou Excel, ou rangez un document (PDF, photo) dans votre espace personnel.</p>

              <div className="mb-4">
                <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-medium mb-2">Format du fichier</label>
                <FormatPicker value={importFormat} onChange={setImportFormat} options={importFormats} />
              </div>

              <div
                className={`flex flex-col justify-center items-center border-2 border-dashed rounded-2xl py-10 px-4 mb-5 cursor-pointer transition ${
                  dragActive ? 'border-[#2563EB] bg-blue-50 dark:bg-[#1E40AF]/25' : 'border-gray-300 dark:border-[#475569] hover:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileSelector}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={importFormat === 'csv' ? '.csv' : importFormat === 'excel' ? '.xlsx,.xls' : '.pdf,.jpg,.jpeg,.png,.webp'}
                />
                {selectedFile ? (
                  <div className="text-center">
                    <MdDescription className="mx-auto text-5xl text-green-500 mb-2" />
                    <div className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold break-all">{selectedFile.name}</div>
                    <div className="text-gray-500 dark:text-[#94A3B8] text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-4 w-full max-w-xs mx-auto">
                        <div className="bg-gray-200 dark:bg-[#475569] rounded-full h-2">
                          <div className="bg-[#2563EB] dark:bg-[#3B82F6] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-[#CBD5E1] mt-1">{uploadProgress} %</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <MdCloudUpload className="mx-auto text-5xl text-gray-300 mb-2" />
                    <span className="text-gray-500 dark:text-[#94A3B8] text-sm">Glissez-déposez votre fichier ici,<br />ou cliquez pour le sélectionner</span>
                  </div>
                )}
              </div>

              {importFormat === 'document' && (
                <Link to="/documents" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
                  <MdFolderOpen /> Voir tous mes documents
                </Link>
              )}

              {importResults && (
                <div className="mb-5 p-4 bg-[#F8FAFC] dark:bg-[#334155]/50 rounded-xl">
                  <h3 className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Résultats de l'import</h3>
                  <div className="text-sm text-gray-700 dark:text-[#E2E8F0] space-y-1">
                    <div>✅ {importResults.imported} transactions importées</div>
                    {importResults.duplicates > 0 && <div>⚠️ {importResults.duplicates} doublons ignorés</div>}
                    {importResults.errors > 0 && <div>❌ {importResults.errors} erreurs</div>}
                  </div>
                  {importResults.details && importResults.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[#2563EB] dark:text-[#60A5FA] text-sm">Voir les détails</summary>
                      <div className="mt-2 text-xs text-gray-600 dark:text-[#CBD5E1]">
                        {importResults.details.map((detail, index) => <div key={index}>{detail}</div>)}
                      </div>
                    </details>
                  )}
                </div>
              )}

              <button
                className={`mt-auto font-semibold px-6 py-3 rounded-xl transition ${
                  loading || !selectedFile ? 'bg-gray-200 dark:bg-[#475569] text-gray-500 dark:text-[#94A3B8] cursor-not-allowed' : 'bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-white'
                }`}
                onClick={handleImport}
                disabled={loading || !selectedFile}
              >
                {loading ? 'Import en cours...' : importFormat === 'document' ? 'Importer le document' : 'Importer les données'}
              </button>
            </section>

            {/* Exporter */}
            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-10 h-10 rounded-xl bg-green-100 dark:bg-[#14532D]/50 text-green-600 dark:text-[#22C55E] flex items-center justify-center text-xl"><MdCloudDownload /></span>
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">Exporter des données</h2>
              </div>
              <p className="text-gray-500 dark:text-[#94A3B8] text-sm mb-5">Choisissez le format et la plage de dates pour télécharger vos données financières.</p>

              <div className="mb-4">
                <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-medium mb-2">Format de l'exportation</label>
                <FormatPicker value={exportFormat} onChange={setExportFormat} options={FORMATS} />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-medium mb-1">Date de début</label>
                  <input type="date" className={INPUT} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-medium mb-1">Date de fin</label>
                  <input type="date" className={INPUT} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>

              <label htmlFor="includePending" className="mb-6 flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC] text-sm cursor-pointer">
                <input
                  type="checkbox"
                  id="includePending"
                  checked={includePending}
                  onChange={(e) => setIncludePending(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                Inclure les transactions en attente
              </label>

              <div className="space-y-3 mt-auto">
                <button
                  className={`w-full font-semibold px-6 py-3 rounded-xl transition ${
                    loading ? 'bg-gray-200 dark:bg-[#475569] text-gray-500 dark:text-[#94A3B8] cursor-not-allowed' : 'bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-white'
                  }`}
                  onClick={handleExport}
                  disabled={loading}
                >
                  {loading ? 'Export en cours...' : 'Exporter les transactions'}
                </button>
                <button
                  className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition ${
                    loading ? 'bg-gray-200 dark:bg-[#475569] text-gray-500 dark:text-[#94A3B8] cursor-not-allowed' : 'border border-[#16A34A] text-[#15803D] dark:text-[#4ADE80] hover:bg-green-50 dark:hover:bg-[#14532D]/30'
                  }`}
                  onClick={handleExportReport}
                  disabled={loading}
                >
                  <MdAssessment /> {loading ? 'Export en cours...' : 'Exporter le rapport financier (PDF)'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
