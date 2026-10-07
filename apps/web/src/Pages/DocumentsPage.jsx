import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '../lib/analytics.js';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import {
  MdFolder, MdCloudUpload, MdPictureAsPdf, MdImage, MdDownload, MdOpenInNew, MdDelete, MdEdit,
  MdSearch, MdErrorOutline, MdCheckCircle, MdClose, MdStorage, MdDescription,
} from 'react-icons/md';
import { getDocuments, uploadDocument, updateDocument, deleteDocument, fetchDocumentFile, downloadBlob } from '../api.js';
import { formatDate } from '../lib/format.js';

const MAX_SIZE = 4 * 1024 * 1024;
const CATEGORIES = [
  { id: 'ticket', label: 'Tickets' },
  { id: 'facture', label: 'Factures' },
  { id: 'releve', label: 'Relevés' },
  { id: 'contrat', label: 'Contrats' },
  { id: 'autre', label: 'Autres' },
];
const labelOf = (id) => CATEGORIES.find((c) => c.id === id)?.label || 'Autres';

const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`);

const CARD = 'bg-white rounded-2xl border border-[#E2E8F0] shadow-sm';
const INPUT = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [uploadCategory, setUploadCategory] = useState('autre');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editing, setEditing] = useState(null);
  const inputRef = useRef(null);

  const notify = (text) => {
    setSuccess(text);
    setTimeout(() => setSuccess(''), 3000);
  };

  const load = useCallback(async () => {
    try {
      const data = await getDocuments({ category, q: query.trim() });
      setDocuments(data.documents || []);
      setTotalSize(data.totalSize || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    let done = 0;
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setError(`« ${file.name} » dépasse 4 Mo.`);
        continue;
      }
      try {
        await uploadDocument(file, { category: uploadCategory });
        trackEvent('document_uploaded', { category: uploadCategory });
        done += 1;
      } catch (err) {
        setError(err.message);
      }
    }
    setUploading(false);
    if (done > 0) {
      notify(`${done} document${done > 1 ? 's' : ''} importé${done > 1 ? 's' : ''} ✓`);
      await load();
    }
  };

  const open = async (doc) => {
    try {
      const blob = await fetchDocumentFile(doc._id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message);
    }
  };

  const download = async (doc) => {
    try {
      downloadBlob(await fetchDocumentFile(doc._id), doc.originalName);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Supprimer « ${doc.name} » définitivement ?`)) return;
    try {
      await deleteDocument(doc._id);
      notify('Document supprimé ✓');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateDocument(editing._id, { name: editing.name, category: editing.category, note: editing.note || '' });
      setEditing(null);
      notify('Document modifié ✓');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pdfCount = documents.filter((d) => d.mimeType === 'application/pdf').length;
  const drag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-5 md:p-10 space-y-6 max-w-6xl">
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdFolder /></span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Mes documents</h1>
              <p className="text-white/85 text-sm mt-1">Tickets, factures, relevés : tous vos documents importés, rangés et privés.</p>
            </div>
          </header>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <MdErrorOutline className="text-xl shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <MdCheckCircle className="text-xl shrink-0" /> {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: MdDescription, label: 'Documents', value: documents.length },
              { icon: MdPictureAsPdf, label: 'Fichiers PDF', value: pdfCount },
              { icon: MdStorage, label: 'Espace utilisé', value: formatSize(totalSize) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className={`${CARD} p-5 flex items-center gap-4`}>
                <span className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center text-2xl"><Icon /></span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</div>
                  <div className="text-xl font-extrabold text-[#0F172A]">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Import */}
          <section className={`${CARD} p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-bold text-lg text-[#0F172A]">Importer un document</h2>
              <label className="flex items-center gap-2 text-sm text-[#0F172A]">
                Ranger dans
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className={INPUT}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
            </div>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-10 px-4 cursor-pointer transition ${
                dragActive ? 'border-[#2563EB] bg-[#DBEAFE]' : 'border-gray-300 hover:border-[#2563EB] hover:bg-[#F8FAFC]'
              }`}
              onDragEnter={drag}
              onDragOver={drag}
              onDragLeave={drag}
              onDrop={(e) => { drag(e); upload(e.dataTransfer.files); }}
              onClick={() => !uploading && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => { upload(e.target.files); e.target.value = ''; }}
              />
              <MdCloudUpload className="text-5xl text-[#2563EB]/50 mb-2" />
              <div className="text-[#0F172A] font-medium text-center">
                {uploading ? 'Import en cours…' : 'Glissez vos fichiers ici, ou cliquez pour les choisir'}
              </div>
              <div className="text-xs text-[#64748B] mt-1">PDF, JPG, PNG ou WebP · 4 Mo maximum par fichier</div>
            </div>
          </section>

          {/* Liste */}
          <section className={`${CARD} p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <div className="flex gap-2 flex-wrap">
                {[{ id: '', label: 'Tous' }, ...CATEGORIES].map((c) => (
                  <button
                    key={c.id || 'all'}
                    onClick={() => setCategory(c.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${category === c.id ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#DBEAFE]'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className={`${INPUT} pl-9 w-56`} />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-[#64748B] py-8 justify-center">
                <span className="h-5 w-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" /> Chargement…
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">
                <MdFolder className="mx-auto text-6xl text-gray-300 mb-2" />
                {category || query ? 'Aucun document ne correspond.' : 'Aucun document pour le moment. Importez votre premier fichier ci-dessus.'}
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {documents.map((doc) => {
                  const isPdf = doc.mimeType === 'application/pdf';
                  const Icon = isPdf ? MdPictureAsPdf : MdImage;
                  return (
                    <li key={doc._id} className="rounded-2xl border border-[#E2E8F0] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start gap-3">
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0 ${isPdf ? 'bg-red-50 text-[#DC2626]' : 'bg-[#DBEAFE] text-[#2563EB]'}`}><Icon /></span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[#0F172A] truncate" title={doc.name}>{doc.name}</div>
                          <div className="text-xs text-[#64748B] mt-0.5">{formatSize(doc.size)} · {formatDate(doc.createdAt)}</div>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold">{labelOf(doc.category)}</span>
                        </div>
                      </div>
                      {doc.note && <p className="text-xs text-[#64748B] line-clamp-2">{doc.note}</p>}
                      <div className="flex gap-1 mt-auto pt-2 border-t border-gray-100">
                        <button onClick={() => open(doc)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-semibold text-[#2563EB] hover:bg-[#DBEAFE]"><MdOpenInNew /> Ouvrir</button>
                        <button onClick={() => download(doc)} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0F172A] hover:bg-gray-100" title="Télécharger" aria-label="Télécharger"><MdDownload /></button>
                        <button onClick={() => setEditing({ ...doc })} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0F172A] hover:bg-gray-100" title="Modifier" aria-label="Modifier"><MdEdit /></button>
                        <button onClick={() => remove(doc)} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#DC2626] hover:bg-red-50" title="Supprimer" aria-label="Supprimer"><MdDelete /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
          <form onSubmit={saveEdit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A]">Modifier le document</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-800" aria-label="Fermer"><MdClose /></button>
            </div>
            <label className="block text-sm font-medium text-[#0F172A]">Nom
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={120} required className={`${INPUT} w-full mt-1`} />
            </label>
            <label className="block text-sm font-medium text-[#0F172A]">Catégorie
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={`${INPUT} w-full mt-1`}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#0F172A]">Note
              <textarea value={editing.note || ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} maxLength={500} rows={3} className={`${INPUT} w-full mt-1`} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-[#0F172A]">Annuler</button>
              <button className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8]">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
