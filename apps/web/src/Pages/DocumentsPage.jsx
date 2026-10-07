import React, { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '../lib/analytics.js';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import {
  MdFolder, MdCloudUpload, MdPictureAsPdf, MdImage, MdDownload, MdOpenInNew, MdDelete, MdEdit,
  MdSearch, MdEventBusy, MdErrorOutline, MdCheckCircle, MdClose, MdStorage, MdDescription,
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

const DAY = 86400000;
// État d'échéance d'un document : null si aucune date
const expiryState = (iso) => {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
  if (days < 0) return { days, tone: 'bg-red-100 text-[#DC2626] dark:bg-[#7F1D1D]/50 dark:text-[#FCA5A5]', label: `Expiré depuis ${-days} j` };
  if (days <= 30) return { days, tone: 'bg-amber-100 text-[#B45309] dark:bg-[#78350F]/50 dark:text-[#FCD34D]', label: days === 0 ? "Expire aujourd'hui" : `Expire dans ${days} j` };
  return { days, tone: 'bg-gray-100 text-[#64748B] dark:bg-[#334155] dark:text-[#CBD5E1]', label: `Valable jusqu'au ${formatDate(iso)}` };
};
const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const CARD = 'bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm';
const INPUT = 'border border-gray-200 dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('');
  const [expiring, setExpiring] = useState(false);
  const [uploadExpiry, setUploadExpiry] = useState('');
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
      const data = await getDocuments({ category, q: query.trim(), expiring: expiring ? '1' : '' });
      setDocuments(data.documents || []);
      setTotalSize(data.totalSize || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [category, query, expiring]);

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
        await uploadDocument(file, { category: uploadCategory, expiresAt: uploadExpiry });
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
      await updateDocument(editing._id, { name: editing.name, category: editing.category, note: editing.note || '', expiresAt: editing.expiresAt ? toDateInput(editing.expiresAt) : '' });
      setEditing(null);
      notify('Document modifié ✓');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pdfCount = documents.filter((d) => d.mimeType === 'application/pdf').length;
  const expiringCount = documents.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() <= 30 * DAY).length;
  const drag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-5 md:p-10 space-y-6 max-w-6xl">
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-6 md:p-8 shadow-sm flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl"><MdFolder /></span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Mes documents</h1>
              <p className="text-white/85 text-sm mt-1">Tickets, factures, relevés : tous vos documents importés, rangés et privés.</p>
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

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: MdDescription, label: 'Documents', value: documents.length },
              { icon: MdEventBusy, label: 'À renouveler (30 j)', value: expiringCount },
              { icon: MdStorage, label: 'Espace utilisé', value: formatSize(totalSize) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className={`${CARD} p-5 flex items-center gap-4`}>
                <span className="w-11 h-11 rounded-xl bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE] flex items-center justify-center text-2xl"><Icon /></span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">{label}</div>
                  <div className="text-xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Import */}
          <section className={`${CARD} p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC]">Importer un document</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                  Ranger dans
                  <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className={INPUT}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-[#0F172A] dark:text-[#F8FAFC]" title="Garantie, contrat, assurance… vous serez prévenu 30 jours avant">
                  Expire le
                  <input type="date" value={uploadExpiry} onChange={(e) => setUploadExpiry(e.target.value)} className={INPUT} />
                </label>
              </div>
            </div>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-10 px-4 cursor-pointer transition ${
                dragActive ? 'border-[#2563EB] bg-[#DBEAFE] dark:bg-[#1E40AF]' : 'border-gray-300 dark:border-[#475569] hover:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
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
              <div className="text-[#0F172A] dark:text-[#F8FAFC] font-medium text-center">
                {uploading ? 'Import en cours…' : 'Glissez vos fichiers ici, ou cliquez pour les choisir'}
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">PDF, JPG, PNG ou WebP · 4 Mo maximum par fichier</div>
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
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${category === c.id ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white' : 'bg-[#F8FAFC] dark:bg-[#334155]/50 text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#DBEAFE] dark:hover:bg-[#1E40AF]'}`}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  onClick={() => setExpiring((v) => !v)}
                  aria-pressed={expiring}
                  className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${expiring ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#334155]/50 text-[#0F172A] dark:text-[#F8FAFC] hover:bg-amber-100 dark:hover:bg-[#78350F]/50'}`}
                >
                  <MdEventBusy /> Expire bientôt
                </button>
              </div>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className={`${INPUT} pl-9 w-56`} />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-[#64748B] dark:text-[#94A3B8] py-8 justify-center">
                <span className="h-5 w-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" /> Chargement…
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-[#64748B] dark:text-[#94A3B8]">
                <MdFolder className="mx-auto text-6xl text-gray-300 mb-2" />
                {category || query ? 'Aucun document ne correspond.' : 'Aucun document pour le moment. Importez votre premier fichier ci-dessus.'}
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {documents.map((doc) => {
                  const isPdf = doc.mimeType === 'application/pdf';
                  const Icon = isPdf ? MdPictureAsPdf : MdImage;
                  return (
                    <li key={doc._id} className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-white dark:bg-[#1E293B]">
                      <div className="flex items-start gap-3">
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0 ${isPdf ? 'bg-red-50 dark:bg-[#7F1D1D]/30 text-[#DC2626] dark:text-[#F87171]' : 'bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE]'}`}><Icon /></span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate" title={doc.name}>{doc.name}</div>
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{formatSize(doc.size)} · {formatDate(doc.createdAt)}</div>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE] text-xs font-semibold">{labelOf(doc.category)}</span>
                          {expiryState(doc.expiresAt) && (
                            <span className={`inline-block mt-1.5 ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${expiryState(doc.expiresAt).tone}`}>{expiryState(doc.expiresAt).label}</span>
                          )}
                        </div>
                      </div>
                      {doc.note && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2">{doc.note}</p>}
                      <div className="flex gap-1 mt-auto pt-2 border-t border-gray-100 dark:border-[#334155]">
                        <button onClick={() => open(doc)} className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-semibold text-[#2563EB] dark:text-[#BFDBFE] hover:bg-[#DBEAFE] dark:hover:bg-[#1E40AF]"><MdOpenInNew /> Ouvrir</button>
                        <button onClick={() => download(doc)} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0F172A] dark:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#334155]" title="Télécharger" aria-label="Télécharger"><MdDownload /></button>
                        <button onClick={() => setEditing({ ...doc })} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0F172A] dark:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#334155]" title="Modifier" aria-label="Modifier"><MdEdit /></button>
                        <button onClick={() => remove(doc)} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#DC2626] dark:hover:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30" title="Supprimer" aria-label="Supprimer"><MdDelete /></button>
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
          <form onSubmit={saveEdit} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Modifier le document</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-500 dark:text-[#94A3B8] hover:text-gray-800 dark:hover:text-[#F8FAFC]" aria-label="Fermer"><MdClose /></button>
            </div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">Nom
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={120} required className={`${INPUT} w-full mt-1`} />
            </label>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">Catégorie
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={`${INPUT} w-full mt-1`}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">Date d'expiration (facultatif)
              <input type="date" value={toDateInput(editing.expiresAt)} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })} className={`${INPUT} w-full mt-1`} />
            </label>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">Note
              <textarea value={editing.note || ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} maxLength={500} rows={3} className={`${INPUT} w-full mt-1`} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-[#475569] text-sm text-[#0F172A] dark:text-[#F8FAFC]">Annuler</button>
              <button className="px-5 py-2 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
