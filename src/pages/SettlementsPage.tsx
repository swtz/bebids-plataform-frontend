import { useMemo, useState } from 'react';
import {
  useSettlements,
  useSettlementPreview,
  useCreateSettlement,
  useUpdateSettlementIsClosed,
  useRefreshSettlement,
  useRemoveSettlement,
} from '@/hooks/useSettlementQueries';
import { useUsers } from '@/hooks/useUserQueries';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
import type { Settlement } from '@/schemas/settlement.schema';
import { todayAsDate } from '@/lib/timeUtils';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton } from '@/components/ui/IconButton';

function useOperatorOptions() {
  const { data } = useUsers();
  return useMemo(
    () => (data ?? []).map(u => ({ value: u.nickname, label: `${u.nickname} — ${u.name} ${u.lastName}` })),
    [data],
  );
}

export function SettlementsListPage() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<Settlement | null>(null);
  const { data, isLoading, error } = useSettlements();
  const updateIsClosed = useUpdateSettlementIsClosed();
  const removeSettlement = useRemoveSettlement();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleToggleClosed = (settlement: Settlement) => {
    if (!settlement.id) return;
    setBusyId(settlement.id);
    run(() => updateIsClosed.mutateAsync({ id: settlement.id!, flag: !settlement.isClosed })).finally(
      () => setBusyId(null),
    );
  };

  const handleDelete = (settlement: Settlement) => {
    if (!settlement.id) return;
    ask('Excluir este caixa? Essa ação não pode ser desfeita.', () => {
      setBusyId(settlement.id!);
      return run(() => removeSettlement.mutateAsync(settlement.id!)).finally(() => setBusyId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader title="Caixas de Televendas" />

      <SettlementPreviewAndCreate />

      {refreshing && (
        <Card style={{ margin: '24px 0' }}>
          <RefreshSettlementForm settlement={refreshing} onDone={() => setRefreshing(null)} />
        </Card>
      )}

      <h2 style={{ fontSize: 16, margin: '32px 0 12px' }}>Caixas já fechados</h2>
      {actionError && <ErrorMessage message={actionError} />}
      <DataTable
        columns={[
          { header: 'Operador', cell: s => s.operator?.nickname ?? '—' },
          { header: 'Dia da semana', cell: s => s.weekDay },
          { header: 'Dia trabalhado', cell: s => new Date(s.workDay).toLocaleDateString('pt-BR') },
          { header: 'Entregas', cell: s => s.quantityDeliveries },
          { header: 'Subtotal', cell: s => `R$ ${Number(s.subtotal).toFixed(2)}` },
          { header: 'Total esperado', cell: s => `R$ ${Number(s.expectedTotal).toFixed(2)}` },
          { header: 'Total atual', cell: s => `R$ ${Number(s.currentTotal).toFixed(2)}` },
          {
            header: 'Fechado?',
            cell: s => (s.isClosed ? <Badge>fechado</Badge> : '—'),
          },
          {
            header: 'Ações',
            cell: s =>
              s.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    variant="secondary"
                    title="Recalcular com os dados mais recentes"
                    onClick={() => setRefreshing(s)}
                  >
                    🔄 Atualizar
                  </Button>
                  <Button
                    variant="secondary"
                    isLoading={busyId === s.id}
                    onClick={() => handleToggleClosed(s)}
                  >
                    {s.isClosed ? 'Reabrir' : 'Fechar'}
                  </Button>
                  <DeleteIconButton
                    title="Excluir caixa"
                    isLoading={busyId === s.id}
                    onClick={() => handleDelete(s)}
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
        getRowKey={s => s.id ?? `${s.weekDay}-${s.workDay}`}
      />
    </div>
  );
}

function RefreshSettlementForm({
  settlement,
  onDone,
}: {
  settlement: Settlement;
  onDone: () => void;
}) {
  const [to, setTo] = useState(todayAsDate());
  const [description, setDescription] = useState(settlement.description ?? '');
  const refreshSettlement = useRefreshSettlement();

  return (
    <div>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
        Recalcula o caixa de <strong>{settlement.operator?.nickname}</strong> até a
        data informada, usando os dados mais recentes do banco (não precisa de
        horário — só a data já é suficiente).
      </p>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field">
          <label htmlFor="refreshSettlementTo">Até</label>
          <Input id="refreshSettlementTo" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="refreshSettlementDescription">Observação (opcional)</label>
          <Input
            id="refreshSettlementDescription"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          type="button"
          disabled={!to}
          isLoading={refreshSettlement.isPending}
          onClick={async () => {
            await refreshSettlement.mutateAsync({ id: settlement.id!, to, description });
            onDone();
          }}
        >
          Confirmar atualização
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
      {refreshSettlement.error && (
        <div style={{ marginTop: 12 }}>
          <ErrorMessage message={refreshSettlement.error.message} />
        </div>
      )}
    </div>
  );
}

/**
 * Coração do módulo: espelha `GET /settlement/preview` (cálculo em tempo
 * real, sem persistir) e permite confirmar e criar o caixa de verdade a
 * partir do mesmo período (`POST /settlement`).
 */
function SettlementPreviewAndCreate() {
  const operatorOptions = useOperatorOptions();
  const placeCodeOptions = usePlaceCodeOptions();

  const [nickname, setNickname] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayAsDate());
  const [placeCode, setPlaceCode] = useState('');
  const [initValue, setInitValue] = useState('');
  const [description, setDescription] = useState('');
  const [previewRequested, setPreviewRequested] = useState(false);

  const canPreview = Boolean(nickname && from && to);

  const preview = useSettlementPreview({ nickname, from, to }, previewRequested && canPreview);
  const createSettlement = useCreateSettlement();
  const [createDone, setCreateDone] = useState(false);

  const handleCreate = async () => {
    if (!canPreview || !placeCode || initValue === '') return;
    setCreateDone(false);
    await createSettlement.mutateAsync({
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
      initValue: Number(initValue),
      description: description || null,
    });
    setCreateDone(true);
  };

  return (
    <Card>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Pré-visualizar caixa</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -6 }}>
        Calcula o caixa do período em tempo real, sem salvar nada ainda (
        <code>GET /settlement/preview</code>). Não precisa de horário — só a data já
        é suficiente.
      </p>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field">
          <label htmlFor="settlementNickname">Operador</label>
          <Select
            id="settlementNickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          >
            <option value="">Selecione…</option>
            {operatorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="form-field">
          <label htmlFor="settlementFrom">De</label>
          <Input id="settlementFrom" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="settlementTo">Até</label>
          <Input id="settlementTo" type="date" value={to} onChange={e => setTo(e.target.value)} />
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
          <SettlementPreviewCard settlement={preview.data} />

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-field">
                <label htmlFor="settlementPlaceCode">Estabelecimento</label>
                <Select
                  id="settlementPlaceCode"
                  value={placeCode}
                  onChange={e => setPlaceCode(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {placeCodeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="form-field">
                <label htmlFor="settlementInitValue">Valor inicial do caixa (R$)</label>
                <Input
                  id="settlementInitValue"
                  type="number"
                  step="0.01"
                  value={initValue}
                  onChange={e => setInitValue(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="settlementDescription">Observação (opcional)</label>
                <Input
                  id="settlementDescription"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              disabled={!placeCode || initValue === ''}
              isLoading={createSettlement.isPending}
              onClick={handleCreate}
            >
              Confirmar e fechar caixa
            </Button>
          </div>

          {createSettlement.error && (
            <div style={{ marginTop: 12 }}>
              <ErrorMessage message={createSettlement.error.message} />
            </div>
          )}
          {createDone && (
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-success)' }}>
              Caixa criado com sucesso — veja na lista abaixo.
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

export function SettlementPreviewCard({ settlement }: { settlement: Settlement }) {
  const money = (n: number) => `R$ ${Number(n).toFixed(2)}`;
  const diff = settlement.currentTotal - settlement.expectedTotal;
  const hasDiff = Math.abs(diff) > 0.009;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{settlement.operator?.nickname}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {settlement.weekDay}, {new Date(settlement.workDay).toLocaleDateString('pt-BR')}
          </div>
        </div>
        {settlement.isClosed !== undefined && (
          <Badge>{settlement.isClosed ? 'fechado' : 'em aberto'}</Badge>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatBox label="Entregas" value={String(settlement.quantityDeliveries)} />
        <StatBox label="Dinheiro" value={money(settlement.moneySubtotal)} />
        <StatBox label="Cartão" value={money(settlement.cardSubtotal)} />
        <StatBox label="Pix" value={money(settlement.pixSubtotal)} />
        <StatBox label="Subtotal" value={money(settlement.subtotal)} />
        {settlement.initValue !== undefined && (
          <StatBox label="Caixa inicial" value={money(settlement.initValue)} />
        )}
        <StatBox label="Total esperado" value={money(settlement.expectedTotal)} highlight />
        <StatBox label="Total atual" value={money(settlement.currentTotal)} />
      </div>

      {hasDiff && (
        <p style={{ fontSize: 13, color: diff < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {diff < 0
            ? `Faltam R$ ${Math.abs(diff).toFixed(2)} em relação ao esperado.`
            : `Sobram R$ ${diff.toFixed(2)} em relação ao esperado.`}
        </p>
      )}

      {settlement.description && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Observação: {settlement.description}
        </p>
      )}

      {settlement.vouchers && settlement.vouchers.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Adiantamentos/descontos no período</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
            {settlement.vouchers.map(v => (
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
