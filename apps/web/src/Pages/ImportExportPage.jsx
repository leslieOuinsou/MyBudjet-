import React, { useState, useRef } from "react";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { Link } from "react-router-dom";
import { 
  importTransactions, 
  exportTransactionsCSV, 
  exportTransactionsExcel, 
  exportTransactionsPDF, 
  exportFinancialReport,
  downloadBlob,
  downloadText
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

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-12 py-10">
          <h1 className="text-3xl font-extrabold text-[#22292F] mb-8">Importer et Exporter des Données</h1>
          
          {/* Messages de feedback */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons mr-2">error</span>
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons mr-2">check_circle</span>
                {success}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Importer */}
            <section className="bg-white rounded-xl border border-[#EAF4FB] p-8 flex flex-col mb-4">
              <h2 className="text-xl font-bold text-[#22292F] mb-2">Importer des Données</h2>
              <p className="text-[#6C757D] text-sm mb-4">Sélectionnez un fichier pour importer vos transactions ou votre budget.<br/>Formats supportés : CSV, Excel. Veuillez vous assurer que votre fichier est correctement formaté.</p>
              
              {/* Zone de drag & drop */}
              <div 
                className={`flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-lg py-8 mb-6 cursor-pointer transition ${
                  dragActive ? 'border-[#1E73BE] bg-blue-50' : 'border-[#EAF4FB] hover:border-[#1E73BE]'
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
                  accept={importFormat === 'csv' ? '.csv' : importFormat === 'excel' ? '.xlsx,.xls' : '.pdf'}
                />
                
                {selectedFile ? (
                  <div className="text-center">
                    <span className="material-icons text-5xl text-green-500 mb-2">description</span>
                    <div className="text-[#22292F] font-medium">{selectedFile.name}</div>
                    <div className="text-[#6C757D] text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-4 w-full max-w-xs">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="material-icons text-5xl text-[#B0B7C3] mb-2">cloud_upload</span>
                    <span className="text-[#6C757D]">Faites glisser et déposez votre fichier ici, ou cliquez pour sélectionner</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-[#343A40] text-sm mb-1">Format du Fichier</label>
                <select 
                  className="w-full border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" 
                  value={importFormat} 
                  onChange={e => setImportFormat(e.target.value)}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>

              {/* Affichage des résultats d'import */}
              {importResults && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Résultats de l'import :</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>✅ {importResults.imported} transactions importées</div>
                    {importResults.duplicates > 0 && (
                      <div>⚠️ {importResults.duplicates} doublons ignorés</div>
                    )}
                    {importResults.errors > 0 && (
                      <div>❌ {importResults.errors} erreurs</div>
                    )}
                  </div>
                  {importResults.details && importResults.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Voir les détails</summary>
                      <div className="mt-2 text-xs text-gray-600">
                        {importResults.details.map((detail, index) => (
                          <div key={index}>{detail}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              <button 
                className={`mt-2 font-semibold px-6 py-2 rounded-lg shadow transition ${
                  loading || !selectedFile 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#1E73BE] hover:bg-[#155a8a] text-white'
                }`}
                onClick={handleImport}
                disabled={loading || !selectedFile}
              >
                {loading ? 'Import en cours...' : 'Importer les Données'}
              </button>
            </section>
            
            {/* Exporter */}
            <section className="bg-white rounded-xl border border-[#EAF4FB] p-8 flex flex-col mb-4">
              <h2 className="text-xl font-bold text-[#22292F] mb-2">Exporter des Données</h2>
              <p className="text-[#6C757D] text-sm mb-4">Choisissez le format et la plage de dates pour télécharger vos données financières.</p>
              
              <div className="mb-4">
                <label className="block text-[#343A40] text-sm mb-1">Format de l'Exportation</label>
                <select 
                  className="w-full border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" 
                  value={exportFormat} 
                  onChange={e => setExportFormat(e.target.value)}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex flex-col flex-1">
                  <label className="block text-[#343A40] text-sm mb-1">Date de début</label>
                  <input 
                    type="date" 
                    className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" 
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)} 
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="block text-[#343A40] text-sm mb-1">Date de fin</label>
                  <input 
                    type="date" 
                    className="border border-[#EAF4FB] rounded-lg px-4 py-2 bg-[#F9FAFB] focus:border-[#1E73BE]" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)} 
                  />
                </div>
              </div>

              <div className="mb-6 flex items-center">
                <input 
                  type="checkbox" 
                  id="includePending" 
                  checked={includePending} 
                  onChange={e => setIncludePending(e.target.checked)} 
                  className="mr-2" 
                />
                <label htmlFor="includePending" className="text-[#343A40] text-sm">Inclure les transactions en attente</label>
              </div>

              <div className="space-y-3">
                <button 
                  className={`w-full font-semibold px-6 py-2 rounded-lg shadow transition ${
                    loading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#1E73BE] hover:bg-[#155a8a] text-white'
                  }`}
                  onClick={handleExport}
                  disabled={loading}
                >
                  {loading ? 'Export en cours...' : 'Exporter les Transactions'}
                </button>

                <button 
                  className={`w-full font-semibold px-6 py-2 rounded-lg shadow transition ${
                    loading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  onClick={handleExportReport}
                  disabled={loading}
                >
                  {loading ? 'Export en cours...' : 'Exporter le Rapport Financier (PDF)'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
