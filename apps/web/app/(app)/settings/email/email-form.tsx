'use client'
import { useState, useTransition } from 'react'
import { saveEmailConfig, sendTestEmail } from './actions'

interface Config {
  smtp_host:    string | null
  smtp_port:    number | null
  smtp_user:    string | null
  encryption:   string | null
  from_name:    string | null
  from_email:   string | null
  is_verified:  boolean | null
  last_test_at: string | null
}

interface Labels {
  save: string
  saving: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpPassPlaceholder: string
  encryption: string
  fromName: string
  fromEmail: string
  testEmail: string
  testEmailSent: string
  testEmailError: string
  emailVerified: string
  emailNotVerified: string
  lastTest: string
  saveEmail: string
  emailNote: string
}

export function EmailForm({ config, labels, jsLocale }: { config: Config; labels: Labels; jsLocale: string }) {
  const [savePending, startSave] = useTransition()
  const [testPending, startTest] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleTest() {
    startTest(async () => {
      const result = await sendTestEmail()
      setTestResult(result)
      setTimeout(() => setTestResult(null), 6000)
    })
  }

  const inputCls = "w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white"
  const labelCls = "block text-[10px] font-bold text-[#556479] mb-1"

  return (
    <form action={saveEmailConfig} className="space-y-6">
      {/* SMTP Settings */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-5">SMTP</div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className={labelCls}>{labels.smtpHost}</label>
            <input name="smtp_host" defaultValue={config.smtp_host ?? ''} placeholder="smtp.resend.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{labels.smtpPort}</label>
            <input name="smtp_port" type="number" defaultValue={config.smtp_port ?? 587} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>{labels.smtpUser}</label>
            <input name="smtp_user" defaultValue={config.smtp_user ?? ''} placeholder="apikey" className={inputCls} autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>{labels.smtpPass}</label>
            <input
              name="smtp_pass"
              type="password"
              placeholder={labels.smtpPassPlaceholder}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelCls}>{labels.encryption}</label>
            <select name="encryption" defaultValue={config.encryption ?? 'tls'} className={inputCls}>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <p className="text-[10px] text-[#b0bac3]">⚠ {labels.emailNote}</p>
      </div>

      {/* Sender */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-5">{labels.fromName}</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{labels.fromName}</label>
            <input name="from_name" defaultValue={config.from_name ?? ''} placeholder="Sovereign Logistics" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{labels.fromEmail}</label>
            <input name="from_email" type="email" defaultValue={config.from_email ?? ''} placeholder="ops@example.com" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Status + Actions */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">Estado</div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                config.is_verified
                  ? 'bg-[#edf6f7] text-[#1A7A8A]'
                  : 'bg-[#f0f2f5] text-[#8a9aaa]'
              }`}
            >
              {config.is_verified ? labels.emailVerified : labels.emailNotVerified}
            </span>
            {config.last_test_at && (
              <span className="text-[10px] text-[#b0bac3]">
                {labels.lastTest} {new Date(config.last_test_at).toLocaleString(jsLocale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {testResult && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-xs font-semibold ${
              testResult.ok
                ? 'bg-[#edf6f7] text-[#1A7A8A] border border-[#1A7A8A]/20'
                : 'bg-[#fef4ed] text-[#C05A00] border border-[#C05A00]/20'
            }`}
          >
            {testResult.ok
              ? labels.testEmailSent.replace('{email}', testResult.message)
              : labels.testEmailError.replace('{error}', testResult.message)
            }
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#142a5c] transition-colors disabled:opacity-60"
          >
            {savePending ? labels.saving : labels.saveEmail}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testPending}
            className="text-xs font-bold text-[#4A6FA5] border border-[#4A6FA5] px-5 py-2.5 rounded-lg hover:bg-[#eef2f8] transition-colors disabled:opacity-60"
          >
            {testPending ? '...' : `✉ ${labels.testEmail}`}
          </button>
        </div>
      </div>
    </form>
  )
}
