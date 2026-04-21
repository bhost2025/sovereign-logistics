import { getTranslations } from 'next-intl/server'
import {
  getContainerDocuments,
  groupDocumentsByCategory,
  getMissingRequiredCategories,
  DOC_STATUS_CONFIG,
  type ContainerDocument,
} from '@/lib/documents'
import { UploadDocumentForm } from './upload-document-form'
import { updateDocumentStatus, deleteDocument } from '@/app/(app)/contenedores/[id]/documents/actions'

function DocStatusBadge({ status }: { status: ContainerDocument['doc_status'] }) {
  const cfg = DOC_STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 pl-0 pr-2 py-0.5 rounded text-[10px] font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-[3px] self-stretch rounded-l" style={{ background: cfg.color }} />
      {cfg.symbol} {cfg.label}
    </span>
  )
}

function DocumentRow({
  doc,
  containerId,
  labels,
}: {
  doc: ContainerDocument
  containerId: string
  labels: { view: string; download: string; approve: string; reject: string; byUploader: string }
}) {
  const approveAction = updateDocumentStatus.bind(null, doc.id, containerId, 'approved')
  const rejectAction  = updateDocumentStatus.bind(null, doc.id, containerId, 'rejected')
  const deleteAction  = deleteDocument.bind(null, doc.id, containerId)

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-[#f0f2f5] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[#181c1e] truncate">{doc.file_name}</span>
          <DocStatusBadge status={doc.doc_status} />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#8a9aaa]">
          {doc.uploader?.full_name && (
            <span>{labels.byUploader} {doc.uploader.full_name}</span>
          )}
          <span>{new Date(doc.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        {doc.comments && (
          <p className="text-[10px] text-[#6b7a8a] mt-1 italic">{doc.comments}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
        >
          {labels.view}
        </a>
        <a
          href={doc.file_url}
          download={doc.file_name}
          className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
        >
          {labels.download}
        </a>
        {(doc.doc_status === 'uploaded' || doc.doc_status === 'pending_review') ? (
          <>
            <form action={approveAction}>
              <button type="submit" className="text-[10px] font-bold text-[#1A7A8A] hover:text-[#0a1a3c] transition-colors">
                {labels.approve}
              </button>
            </form>
            <form action={rejectAction}>
              <button type="submit" className="text-[10px] font-bold text-[#C05A00] hover:text-[#0a1a3c] transition-colors">
                {labels.reject}
              </button>
            </form>
          </>
        ) : null}
        <form action={deleteAction}>
          <button
            type="submit"
            className="text-[10px] font-bold text-[#b0bac3] hover:text-[#C05A00] transition-colors"
          >
            ✕
          </button>
        </form>
      </div>
    </div>
  )
}

export async function DocumentsTab({
  containerId,
  filterStatus,
}: {
  containerId: string
  filterStatus?: string
}) {
  const [docs, t] = await Promise.all([
    getContainerDocuments(containerId),
    getTranslations('documents'),
  ])

  const groups  = groupDocumentsByCategory(docs)
  const missing = getMissingRequiredCategories(docs)

  const totalDocs    = docs.length
  const approvedDocs = docs.filter(d => d.doc_status === 'approved').length
  const pendingDocs  = docs.filter(d => d.doc_status === 'pending_review' || d.doc_status === 'uploaded').length

  const docLabels = {
    view:       t('preview'),
    download:   t('download'),
    approve:    t('approve'),
    reject:     t('reject'),
    byUploader: t('byUploader'),
  }

  return (
    <div className="space-y-5">

      {/* Missing docs warning */}
      {missing.length > 0 && (
        <div className="bg-[#fef4ed] border-l-[3px] border-[#C05A00] rounded-r-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#C05A00] mb-1">
            ▲ {missing.length} {t('missing').toLowerCase()} {t('required')}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {missing.map(cat => (
              <span key={cat.slug} className="text-[10px] font-semibold bg-[#fdeee3] text-[#C05A00] px-2 py-0.5 rounded">
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="flex items-center gap-6 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] px-5 py-3">
        <div className="text-center">
          <div className="text-lg font-extrabold text-[#0a1a3c]">{totalDocs}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('total')}</div>
        </div>
        <div className="w-px h-8 bg-[#f0f2f5]" />
        <div className="text-center">
          <div className="text-lg font-extrabold text-[#1A7A8A]">{approvedDocs}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('approved')}</div>
        </div>
        <div className="w-px h-8 bg-[#f0f2f5]" />
        <div className="text-center">
          <div className="text-lg font-extrabold text-[#B8860B]">{pendingDocs}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('pending')}</div>
        </div>
        <div className="w-px h-8 bg-[#f0f2f5]" />
        <div className="text-center">
          <div className="text-lg font-extrabold text-[#C05A00]">{missing.length}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('missing')}</div>
        </div>
        <div className="flex-1" />
        {/* Filter strip */}
        <div className="flex gap-1">
          {[
            { label: t('filterAll'),      value: '' },
            { label: t('filterApproved'), value: 'approved' },
            { label: t('filterPending'),  value: 'pending_review' },
            { label: t('filterRejected'), value: 'rejected' },
          ].map(f => (
            <a
              key={f.value}
              href={`?tab=documentos${f.value ? `&doc_status=${f.value}` : ''}`}
              className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
                (filterStatus ?? '') === f.value
                  ? 'bg-[#0a1a3c] text-white'
                  : 'bg-[#f0f2f5] text-[#556479] hover:bg-[#e0e3e8]'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* Upload form */}
      <UploadDocumentForm containerId={containerId} />

      {/* Document categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => {
          const groupDocs = filterStatus
            ? group.documents.filter(d => d.doc_status === filterStatus)
            : group.documents

          const hasAnyDocs  = group.documents.length > 0
          const allApproved = hasAnyDocs && group.documents.every(d => d.doc_status === 'approved')
          const hasMissing  = group.required && !hasAnyDocs

          return (
            <div
              key={group.slug}
              className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden"
            >
              {/* Category header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  borderTop: hasMissing
                    ? '3px solid #C05A00'
                    : allApproved
                    ? '3px solid #1A7A8A'
                    : hasAnyDocs
                    ? '3px solid #B8860B'
                    : '3px solid #e8ebee',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#181c1e]">{group.label}</span>
                  {group.required && (
                    <span className="text-[9px] font-bold text-[#8a9aaa] uppercase tracking-wider">{t('required')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#8a9aaa]">
                    {group.documents.length} doc{group.documents.length !== 1 ? 's' : ''}
                  </span>
                  {hasMissing  && <span className="text-[10px] font-bold text-[#C05A00]">{t('missingLabel')}</span>}
                  {allApproved && <span className="text-[10px] font-bold text-[#1A7A8A]">{t('completeLabel')}</span>}
                </div>
              </div>

              {/* Documents */}
              <div className="px-4 pb-3">
                {groupDocs.length > 0 ? (
                  groupDocs.map(doc => (
                    <DocumentRow key={doc.id} doc={doc} containerId={containerId} labels={docLabels} />
                  ))
                ) : (
                  <p className="text-[11px] text-[#b0bac3] py-3 text-center">
                    {filterStatus ? t('noDocsFilter') : t('noDocuments')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
