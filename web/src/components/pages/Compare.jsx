'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import Icon from '@/src/components/Icon';
import { Card, Badge, RiskChip, Button } from '@/src/components/ui';
import API from '@/src/lib/api';
import DATA from '@/src/lib/data';

export default function Compare({ a, b }) {
  const ctx = useApp();
  const t = ctx.t;
  const lang = ctx.lang;
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    if (!a || !b) return;
    let cancel = false;
    (async () => {
      if (!await API.probe()) return;
      try { const j = await API.compare(a, b); if (!cancel) setRemote(j); } catch {}
    })();
    return () => { cancel = true; };
  }, [a, b]);

  const C = remote || DATA.COMPARE;

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <button onClick={() => ctx.navigate('/library')} className="text-ink-200 hover:text-ink-50 text-sm flex items-center gap-1 mb-4">
        <Icon name="arrow-left" size={14}/> {t.common.back}
      </button>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-50 mb-1">{t.compare.title}</h1>

      <div className="grid grid-cols-2 gap-4 mt-6 mb-8">
        <Card className="p-5 border-teal-500/30">
          <div className="text-ink-300 text-xs uppercase tracking-wide mb-2">{t.compare.pickA}</div>
          <div className="flex items-center gap-2"><Icon name="github" size={18} className="text-ink-200"/>
            <span className="font-mono text-ink-50 text-lg">{C.a}</span></div>
        </Card>
        <Card className="p-5 border-violet-500/30">
          <div className="text-ink-300 text-xs uppercase tracking-wide mb-2">{t.compare.pickB}</div>
          <div className="flex items-center gap-2"><Icon name="github" size={18} className="text-ink-200"/>
            <span className="font-mono text-ink-50 text-lg">{C.b}</span></div>
        </Card>
      </div>

      <Section title={t.compare.shared} icon="package">
        {C.shared.length === 0
          ? <p className="text-ink-300 text-sm">— no shared dependencies —</p>
          : (
            <div className="overflow-hidden rounded-lg border border-ink-700">
              <table className="w-full text-sm">
                <thead className="bg-ink-900">
                  <tr className="text-ink-300 text-[11.5px] uppercase tracking-wide">
                    <th className="text-left font-medium px-3 py-2">Dependency</th>
                    <th className="text-left font-medium px-3 py-2">{C.a}</th>
                    <th className="text-left font-medium px-3 py-2">{C.b}</th>
                    <th className="text-left font-medium px-3 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {C.shared.map(s => (
                    <tr key={s.dep} className="border-t border-ink-700/60">
                      <td className="px-3 py-2.5 font-mono text-ink-50">{s.dep}</td>
                      <td className="px-3 py-2.5 font-mono text-ink-200">{s.a}</td>
                      <td className="px-3 py-2.5 font-mono text-ink-200">{s.b}</td>
                      <td className="px-3 py-2.5"><RiskChip level={s.risk}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Section>

      <Section title={t.compare.patterns} icon="git-pull-request">
        <div className="space-y-2">
          {(C.patternsToBorrow || []).map((p, i) => (
            <Card key={i} className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2 text-[13px]">
                <Badge tone="teal">{p.from}</Badge>
                <Icon name="arrow-right" size={14} className="text-ink-300"/>
                <Badge tone="purple">{p.to}</Badge>
              </div>
              <div className="text-ink-100 text-sm flex-1">{p.what[lang]}</div>
              <Button size="sm" variant="outline">{t.common.viewCode}</Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t.compare.divergence} icon="git-branch">
        <div className="grid grid-cols-1 gap-2">
          {(C.divergence || []).map((d, i) => (
            <Card key={i} className="p-4 grid grid-cols-3 gap-4 items-center">
              <div className="text-ink-200 text-sm">{d.aspect[lang]}</div>
              <div className="font-mono text-ink-50 text-[13px]">{d.a}</div>
              <div className="font-mono text-ink-50 text-[13px]">{d.b}</div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-ink-50 text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon name={icon} size={16} className="text-teal-400"/> {title}
      </h2>
      {children}
    </div>
  );
}
