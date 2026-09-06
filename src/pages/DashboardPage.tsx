import { useMemo, useRef, useState } from 'react';
import { useMe } from '@/hooks/useUserQueries';
import { useDeliveries } from '@/hooks/useDeliveryQueries';
import { useDeliveryMen } from '@/hooks/useDeliveryManQueries';
import { useSettlements } from '@/hooks/useSettlementQueries';
import { useVouchers } from '@/hooks/useVoucherQueries';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable } from '@/components/resource/DataTable';
import type { Settlement } from '@/schemas/settlement.schema';

const money = (n: number) => `R$ ${Number(n).toFixed(2)}`;

function isSameDay(iso: string, reference: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const todayLabel = (() => {
  const label = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
})();

function KpiCard({
  kicker,
  value,
  delta,
  highlight,
}: {
  kicker: string;
  value: string;
  delta?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="card elev-sm"
      style={
        highlight
          ? { background: 'var(--color-accent)', color: 'var(--color-bg)' }
          : undefined
      }
    >
      <div className="card-kicker" style={highlight ? { color: 'var(--color-bg)', opacity: 0.75 } : undefined}>
        {kicker}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 30 }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 12, color: highlight ? undefined : 'var(--color-accent-2-700)', opacity: highlight ? 0.85 : 1 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

interface RankingEntry {
  id: string;
  name: string;
  nickname: string;
  count: number;
  total: number;
}

/** Card "Ranking de motoboys" — extraído pra ser reaproveitado no grid (desktop) e no carrossel (mobile). */
function RankingCard({ ranking }: { ranking: RankingEntry[] }) {
  const topCount = ranking[0]?.count ?? 0;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="card elev-sm" style={{ minWidth: 0, height: '100%' }}>
      <div className="card-kicker">Ranking de motoboys · geral</div>
      <div className="card-title" style={{ marginBottom: 10 }}>
        Quem mais entregou
      </div>
      {ranking.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13 }}>
          Nenhuma entrega registrada ainda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ranking.map((entry, index) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 22, flexShrink: 0, fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--color-accent-700)' }}>
                {medals[index] ?? index + 1}
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--color-accent-2-200)',
                  color: 'var(--color-accent-2-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {entry.nickname.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, marginBottom: 4 }}>
                  <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name || entry.nickname}
                  </strong>
                  <span className="text-muted" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {entry.count} entregas · {money(entry.total)}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--color-neutral-200)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      background: 'var(--color-accent)',
                      width: `${topCount > 0 ? (entry.count / topCount) * 100 : 0}%`,
                      transition: 'width 1s cubic-bezier(.2,.8,.2,1)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Card "Caixas em aberto" — mesma lógica de extração do RankingCard. */
function OpenSettlementsCard({ openSettlements }: { openSettlements: Settlement[] }) {
  return (
    <div className="card elev-sm" style={{ minWidth: 0, height: '100%' }}>
      <div className="card-kicker">Caixas em aberto</div>
      <div className="card-title" style={{ marginBottom: 10 }}>
        Pendentes de fechamento
      </div>
      {openSettlements.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13 }}>
          Nenhum caixa em aberto no momento.
        </p>
      ) : (
        openSettlements.slice(0, 4).map(s => (
          <div
            key={s.id ?? `${s.weekDay}-${s.workDay}`}
            className="card"
            style={{
              background: 'var(--color-bg)',
              padding: '12px 14px',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.operator?.nickname ?? '—'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap' }}>
                {s.weekDay} · {new Date(s.workDay).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{money(s.expectedTotal)}</div>
              <span className="tag tag-outline">em aberto</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function RecentVouchersCard({
  recentVouchers,
}: {
  recentVouchers: ReturnType<typeof useVouchers>['data'];
}) {
  return (
    <div className="card elev-sm" style={{ minWidth: 0, height: '100%' }}>
      <div className="card-kicker">Adiantamentos ativos · recentes</div>
      <div className="card-title" style={{ marginBottom: 10 }}>
        Últimos adiantamentos lançados
      </div>
      <DataTable
        columns={[
          { header: 'Motoboy', cell: v => v.user?.nickname ?? '—' },
          { header: 'Valor', cell: v => money(v.amount) },
          { header: 'Descrição', cell: v => v.description ?? '—' },
          { header: 'Criado em', cell: v => new Date(v.createdAt).toLocaleString('pt-BR') },
          { header: 'Criado por', cell: v => v.createdBy?.nickname ?? '—' },
        ]}
        data={recentVouchers}
        isLoading={false}
        emptyMessage="Nenhum adiantamento lançado ainda."
        getRowKey={v => v.id}
      />
    </div>
  );
}

/** Junta os 3 cards num carrossel horizontal com "barra de rolagem" — só usado no mobile. */
function DashboardCarousel({ slides }: { slides: React.ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
  };

  const thumbWidthPct = 100 / slides.length;

  return (
    <div>
      <div ref={trackRef} className="dashboard-carousel-track" onScroll={handleScroll}>
        {slides.map((slide, i) => (
          <div className="dashboard-carousel-slide" key={i}>
            {slide}
          </div>
        ))}
      </div>
      <div className="dashboard-carousel-bar-track">
        <div
          className="dashboard-carousel-bar-thumb"
          style={{
            width: `${thumbWidthPct}%`,
            transform: `translateX(${scrollPct * (100 / thumbWidthPct - 1) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries();
  const { data: motoboys, isLoading: motoboysLoading } = useDeliveryMen();
  const { data: settlements, isLoading: settlementsLoading } = useSettlements();
  const { data: vouchers, isLoading: vouchersLoading } = useVouchers();
  const isMobile = useIsMobile();

  const isLoading = meLoading || deliveriesLoading || motoboysLoading || settlementsLoading || vouchersLoading;

  const now = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const deliveriesToday = useMemo(
    () => (deliveries ?? []).filter(d => isSameDay(d.createdAt, now)),
    [deliveries, now],
  );
  const deliveriesYesterday = useMemo(
    () => (deliveries ?? []).filter(d => isSameDay(d.createdAt, yesterday)),
    [deliveries, yesterday],
  );

  const revenueToday = deliveriesToday.reduce((sum, d) => sum + Number(d.totalPurchase), 0);
  const revenueYesterday = deliveriesYesterday.reduce((sum, d) => sum + Number(d.totalPurchase), 0);

  const deliveriesDelta = pctDelta(deliveriesToday.length, deliveriesYesterday.length);
  const revenueDelta = pctDelta(revenueToday, revenueYesterday);

  const activeMotoboys = (motoboys ?? []).filter(m => {
    const motorcycle = m.motorcycle as { isActive?: boolean } | null;
    return motorcycle?.isActive === true;
  }).length;

  const openSettlements = (settlements ?? []).filter(s => s.isClosed === false);

  const ranking = useMemo(() => {
    const map = new Map<string, RankingEntry>();
    for (const d of deliveries ?? []) {
      const user = d.motoboy;
      if (!user?.id) continue;
      const entry = map.get(user.id) ?? {
        id: user.id,
        name: `${user.name ?? ''} ${user.lastName ?? ''}`.trim(),
        nickname: user.nickname ?? '',
        count: 0,
        total: 0,
      };
      entry.count += 1;
      entry.total += Number(d.totalPurchase) || 0;
      map.set(user.id, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [deliveries]);

  const recentVouchers = useMemo(
    () =>
      [...(vouchers ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [vouchers],
  );

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 30, marginBottom: 2 }}>Olá{me ? `, ${me.name}` : ''} 👋</h1>
      <p className="text-muted" style={{ marginBottom: 26 }}>
        {todayLabel} · resumo em tempo real da rede.
      </p>

      <div
        className="kpis"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <KpiCard
          kicker="Entregas hoje"
          value={String(deliveriesToday.length)}
          delta={deliveriesDelta !== null ? `${deliveriesDelta >= 0 ? '▲' : '▼'} ${Math.abs(deliveriesDelta)}% vs. ontem` : undefined}
        />
        <KpiCard
          kicker="Faturamento hoje"
          value={money(revenueToday)}
          delta={revenueDelta !== null ? `${revenueDelta >= 0 ? '▲' : '▼'} ${Math.abs(revenueDelta)}% vs. ontem` : undefined}
        />
        <KpiCard
          kicker="Motoboys ativos"
          value={String(activeMotoboys)}
          delta={`de ${(motoboys ?? []).length} cadastrados`}
        />
        <KpiCard
          kicker="Caixas pendentes"
          value={String(openSettlements.length)}
          delta="aguardando fechamento"
          highlight
        />
      </div>

      {isMobile ? (
        <DashboardCarousel
          slides={[
            <RankingCard ranking={ranking} />,
            <OpenSettlementsCard openSettlements={openSettlements} />,
            <RecentVouchersCard recentVouchers={recentVouchers} />,
          ]}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
            <RankingCard ranking={ranking} />
            <OpenSettlementsCard openSettlements={openSettlements} />
          </div>
          <RecentVouchersCard recentVouchers={recentVouchers} />
        </>
      )}
    </div>
  );
}
