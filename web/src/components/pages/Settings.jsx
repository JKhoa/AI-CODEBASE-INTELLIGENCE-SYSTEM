'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Button, Badge, SegControl, Spinner } from '@/src/components/ui';
import API, { loadLlmCfg, saveLlmCfg } from '@/src/lib/api';
import cx from '@/src/lib/cx';

export default function Settings() {
  const ctx = useApp();
  const t = ctx.t;
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey]     = useState('');
  const [model, setModel]       = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const cfg = loadLlmCfg();
    setProvider(cfg.provider || (ctx.mode === 'local' ? 'ollama' : 'anthropic'));
    setApiKey(cfg.apiKey || '');
    setModel(cfg.model || '');
  }, [ctx.mode]);

  const save = async () => {
    const cfg = { provider, apiKey, model: model || undefined };
    saveLlmCfg(cfg);
    if (await API.probe()) { try { await API.setLlmCfg(cfg); } catch {} }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    try {
      if (await API.probe()) {
        const r = await API.testLlm({ provider, apiKey, model: model || undefined });
        setTestResult(r);
      } else {
        setTestResult({ ok: false, error: 'Backend offline — start server.py first.' });
      }
    } catch (e) {
      setTestResult({ ok: false, error: String(e.message || e) });
    } finally { setTesting(false); }
  };

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-50 mb-8">{t.settings.title}</h1>

      <Row label={t.settings.lang}>
        <SegControl value={ctx.lang} onChange={ctx.setLang} options={[
          { value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' },
        ]}/>
      </Row>
      <Row label={t.settings.theme}>
        <SegControl value={ctx.theme} onChange={ctx.setTheme} options={[
          { value: 'dark',  label: <span className="inline-flex items-center gap-1.5"><Icon name="moon" size={12}/>Dark</span> },
          { value: 'light', label: <span className="inline-flex items-center gap-1.5"><Icon name="sun" size={12}/>Light</span> },
        ]}/>
      </Row>
      <Row label={t.settings.mode}>
        <SegControl value={ctx.mode} onChange={ctx.setMode} options={[
          { value: 'cloud', label: 'Cloud' }, { value: 'local', label: 'Local' },
        ]}/>
      </Row>

      <Row label={t.settings.provider}>
        <select value={provider} onChange={e => setProvider(e.target.value)} className="text-sm">
          <option value="anthropic">Anthropic — Claude</option>
          <option value="openai">OpenAI — GPT</option>
          <option value="ollama">Ollama (local)</option>
        </select>
      </Row>
      <Row label="Model" desc={ctx.lang === 'vi'
        ? 'Bỏ trống để dùng mặc định.'
        : 'Leave blank to use defaults.'}>
        <input value={model} onChange={e => setModel(e.target.value)}
          placeholder={
            provider === 'anthropic' ? 'claude-haiku-4-5-20251001' :
            provider === 'openai'    ? 'gpt-4o-mini' : 'llama3.1:8b'}
          className="text-sm w-72 font-mono"/>
      </Row>

      {provider !== 'ollama' && (
        <Row label={t.settings.apiKey} desc={ctx.lang === 'vi'
          ? 'Lưu trong localStorage trình duyệt và gửi kèm mỗi lần chat.'
          : 'Stored in browser localStorage and sent with every chat call.'}>
          <div className="flex items-center gap-2 flex-1 max-w-md px-3 h-9 rounded-lg bg-ink-900 border border-ink-700 focus-within:border-teal-500/60">
            <Icon name="key" size={14} className="text-ink-300"/>
            <input type={showKey ? 'text' : 'password'} value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={t.settings.apiKeyPlaceholder}
              className="flex-1 bg-transparent border-0 outline-none text-sm font-mono text-ink-50 placeholder:text-ink-300"/>
            <button type="button" onClick={() => setShowKey(s => !s)} className="text-ink-300 hover:text-ink-100">
              <Icon name="eye" size={14}/>
            </button>
          </div>
        </Row>
      )}

      <Row label={ctx.lang === 'vi' ? 'Kiểm tra kết nối' : 'Test connection'}>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={testConnection} disabled={testing}>
            {testing ? <Spinner size={12}/> : <Icon name="zap" size={12}/>}Ping LLM
          </Button>
          {testResult && (
            <span className={cx('text-sm', testResult.ok ? 'text-emerald-300' : 'text-red-300')}>
              {testResult.ok ? '✓ ' + (testResult.answer || 'OK') : '✗ ' + (testResult.error || 'failed')}
            </span>
          )}
        </div>
      </Row>

      <Row label={t.settings.privacy} desc={t.settings.privacyDesc}>
        <Badge tone="green"><Icon name="lock" size={11}/>{ctx.mode === 'local' ? 'Zero-trust' : 'Workspace only'}</Badge>
      </Row>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="primary" onClick={save}><Icon name="check" size={14}/>{t.common.save}</Button>
        {savedFlash && <span className="text-teal-400 text-sm fade-in">{t.settings.saved} ✓</span>}
      </div>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-6 py-5 border-t border-ink-700/60 first:border-t-0">
      <div>
        <div className="text-ink-50 font-medium text-sm">{label}</div>
        {desc && <div className="text-ink-300 text-[12.5px] mt-1 leading-relaxed">{desc}</div>}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
