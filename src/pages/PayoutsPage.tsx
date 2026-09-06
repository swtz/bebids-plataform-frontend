import { useMemo, useState } from 'react';
import {
  usePayouts,
  usePayoutPreview,
  useCreatePayout,
  useUpdatePayoutIsClosed,
  useRefreshPayout,
  useRemovePayout,
} from '@/hooks/usePayoutQueries';
import { useDeliveryMen } from '@/hooks/useDeliveryManQueries';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
import type { Payout } from '@/schemas/payout.schema';
import type { DeliveryMan } from '@/schemas/deliveryMan.schema';
import type { SmallUser } from '@/schemas/user.schema';
import { todayAsDate } from '@/lib/timeUtils';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton } from '@/components/ui/IconButton';

function useMotoboyOptions() {
  const { data } = useDeliveryMen();
  return useMemo(
    () =>
      (data ?? []).map((d: DeliveryMan) => {
        const user = d.user as Partial<SmallUser> | undefined;
        return {
          value: user?.nickname ?? '',
          label: user ? `${user.nickname} — ${user.name} ${user.lastName}` : d.id,
        };
      }),
    [data],
  );
}

export function PayoutsListPage() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<Payout | null>(null);
  const { data, isLoading, error } = usePayouts();
  const updateIsClosed = useUpdatePayoutIsClosed();
  const removePayout = useRemovePayout();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleToggleClosed = (payout: Payout) => {
    if (!payout.id) return;
    setBusyId(payout.id);
    run(() => updateIsClosed.mutateAsync({ id: payout.id!, flag: !payout.isClosed })).finally(() =>
      setBusyId(null),
    );
  };

  const handleDelete = (payout: Payout) => {
    if (!payout.id) return;
    ask('Excluir este pagamento? Essa ação não pode ser desfeita.', () => {
      setBusyId(payout.id!);
      return run(() => removePayout.mutateAsync(payout.id!)).finally(() => setBusyId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader title="Pagamentos de Motoboy" />

      <PayoutPreviewAndCreate />

      {refreshing && (
        <Card style={{ margin: '24px 0' }}>
          <RefreshPayoutForm payout={refreshing} onDone={() => setRefreshing(null)} />
        </Card>
      )}

      <h2 style={{ fontSize: 16, margin: '32px 0 12px' }}>Pagamentos já fechados</h2>
      {actionError && <ErrorMessage message={actionError} />}
      <DataTable
        columns={[
          { header: 'Motoboy', cell: p => p.motoboy?.nickname ?? '—' },
          { header: 'Dia da semana', cell: p => p.weekDay },
          { header: 'Dia trabalhado', cell: p => new Date(p.workDay).toLocaleDateString('pt-BR') },
          { header: 'Entregas', cell: p => p.quantityDeliveries },
          { header: 'Diária', cell: p => `R$ ${Number(p.motoboyDaily).toFixed(2)}` },
          { header: 'Gorjetas', cell: p => `R$ ${Number(p.motoboyTips).toFixed(2)}` },
          { header: 'Total', cell: p => `R$ ${Number(p.total).toFixed(2)}` },
          {
            header: 'Fechado?',
            cell: p => (p.isClosed ? <Badge>fechado</Badge> : '—'),
          },
          {
            header: 'Ações',
            cell: p =>
              p.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    variant="secondary"
                    title="Recalcular com os dados mais recentes"
                    onClick={() => setRefreshing(p)}
                  >
                    🔄 Atualizar
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={busyId === p.id}
                    onClick={() => handleToggleClosed(p)}
                  >
                    {p.isClosed ? 'Reabrir' : 'Fechar'}
                  </Button>
                  <DeleteIconButton
                    title="Excluir pagamento"
                    isLoading={busyId === p.id}
                    onClick={() => handleDelete(p)}
                  />
                </div>
              ) : (
                '—'
              ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={p => p.id ?? `${p.weekDay}-${p.workDay}`}
      />
    </div>
  );
}

function RefreshPayoutForm({ payout, onDone }: { payout: Payout; onDone: () => void }) {
  const [to, setTo] = useState(todayAsDate());
  const refreshPayout = useRefreshPayout();

  return (
    <div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
        Recalcula o pagamento de <strong>{payout.motoboy?.nickname}</strong> até a data
        informada, usando os dados mais recentes do banco (não precisa de hora — só a
        data já é suficiente).
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div className="form-field" style={{ maxWidth: 200 }}>
          <label htmlFor="refreshPayoutTo">Até</label>
          <Input id="refreshPayoutTo" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button
          type="button"
          disabled={!to}
          isLoading={refreshPayout.isPending}
          onClick={async () => {
            await refreshPayout.mutateAsync({ id: payout.id!, to });
            onDone();
          }}
        >
          Confirmar atualização
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
      {refreshPayout.error && (
        <div style={{ marginTop: 12 }}>
          <ErrorMessage message={refreshPayout.error.message} />
        </div>
      )}
    </div>
  );
}

/**
 * Coração do módulo: espelha `GET /payout/preview` (cálculo em tempo real,
 * sem persistir) e, a partir do mesmo período, permite confirmar e criar o
 * pagamento de verdade (`POST /payout`, que roda o preview de novo por
 * baixo dos panos com os dados exatos deste formulário).
 */
function PayoutPreviewAndCreate() {
  const motoboyOptions = useMotoboyOptions();
  const placeCodeOptions = usePlaceCodeOptions();

  const [nickname, setNickname] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayAsDate());
  const [placeCode, setPlaceCode] = useState('');
  const [previewRequested, setPreviewRequested] = useState(false);

  const canPreview = Boolean(nickname && from && to);

  const preview = usePayoutPreview({ nickname, from, to }, previewRequested && canPreview);
  const createPayout = useCreatePayout();
  const [createDone, setCreateDone] = useState(false);

  const handleCreate = async () => {
    if (!canPreview || !placeCode) return;
    setCreateDone(false);
    await createPayout.mutateAsync({
      user: {
        id: null,
        nickname,
        name: null,
        lastName: null,
        email: null,
        phone: null,
        secondPhone: null,
      },
      from,
      to,
      placeCode,
    });
    setCreateDone(true);
  };

  return (
    <Card>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Pré-visualizar pagamento</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -6 }}>
        Calcula diária + gorjetas + adiantamentos do período em tempo real, sem salvar nada
        ainda (<code>GET /payout/preview</code>). Não precisa de horário — só a data
        já é suficiente.
      </p>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field">
          <label htmlFor="payoutNickname">Motoboy</label>
          <EntitySelectButton
            id="payoutNickname"
            value={nickname}
            onChange={setNickname}
            options={motoboyOptions}
            title="Motoboy"
          />
        </div>
        <div className="form-field">
          <label htmlFor="payoutFrom">De</label>
          <Input id="payoutFrom" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="payoutTo">Até</label>
          <Input id="payoutTo" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <Button
        type="button"
        disabled={!canPreview}
        isLoading={preview.isFetching}
        onClick={() => setPreviewRequested(true)}
      >
        Visualizar
      </Button>

      {previewRequested && preview.isLoading && <Spinner label="Calculando…" />}
      {previewRequested && preview.error && (
        <div style={{ marginTop: 16 }}>
          <ErrorMessage message={(preview.error as Error).message} />
        </div>
      )}

      {previewRequested && preview.data && (
        <div style={{ marginTop: 20 }}>
          <PayoutPreviewCard payout={preview.data} />

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div className="form-field" style={{ maxWidth: 320 }}>
              <label htmlFor="payoutPlaceCode">Estabelecimento</label>
              <EntitySelectButton
                id="payoutPlaceCode"
                value={placeCode}
                onChange={setPlaceCode}
                options={placeCodeOptions}
                title="Estabelecimento"
              />
            </div>
            <Button
              type="button"
              disabled={!placeCode}
              isLoading={createPayout.isPending}
              onClick={handleCreate}
            >
              Confirmar e fechar pagamento
            </Button>
          </div>

          {createPayout.error && (
            <div style={{ marginTop: 12 }}>
              <ErrorMessage message={createPayout.error.message} />
            </div>
          )}
          {createDone && (
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-success)' }}>
              Pagamento criado com sucesso — veja na lista abaixo.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        background: highlight ? 'var(--color-accent)' : 'var(--color-bg)',
        color: highlight ? 'var(--color-bg)' : 'var(--color-text)',
        borderRadius: 'calc(var(--radius-lg) * 1.15)',
        padding: '12px 16px',
        minWidth: 130,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export function PayoutPreviewCard({ payout }: { payout: Payout }) {
  const money = (n: number) => `R$ ${Number(n).toFixed(2)}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {payout.motoboy?.nickname} — {payout.motoboy?.name} {payout.motoboy?.lastName}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {payout.weekDay}, {new Date(payout.workDay).toLocaleDateString('pt-BR')}
            {payout.motoboy?.motorcycle && ` · ${payout.motoboy.motorcycle.licensePlate}`}
          </div>
        </div>
        {payout.isClosed !== undefined && (
          <Badge>{payout.isClosed ? 'fechado' : 'em aberto'}</Badge>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBox label="Entregas" value={String(payout.quantityDeliveries)} />
        <StatBox label="Diária" value={money(payout.motoboyDaily)} />
        <StatBox label="Gorjetas" value={money(payout.motoboyTips)} />
        <StatBox label="Gasto do motoboy" value={money(payout.totalSpending)} />
        <StatBox label="Subtotal" value={money(payout.subtotal)} />
        <StatBox label="Total a pagar" value={money(payout.total)} highlight />
      </div>

      {payout.vouchers && payout.vouchers.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Adiantamentos/descontos no período</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
            {payout.vouchers.map(v => (
              <li
                key={v.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span>{v.description ?? 'Adiantamento'}</span>
                <span>{money(v.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
