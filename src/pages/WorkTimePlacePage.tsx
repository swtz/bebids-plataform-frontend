import { useMemo, useState } from 'react';
import {
  useWorkTimesOfPlace,
  useAddWorkTimeToPlace,
  useUpdateSharedWorkTime,
  useRemoveSharedWorkTime,
  useWorkTimePlaceDateRange,
} from '@/hooks/useWorkTimeQueries';
import { usePlaces } from '@/hooks/usePlaceQueries';
import {
  createWorkTimeSchema,
  updateWorkTimeSchema,
  type CreateWorkTimeInput,
  type UpdateWorkTimeInput,
  type WorkTime,
} from '@/schemas/workTime.schema';
import { workTimeFields } from '@/components/resource/workTimeFieldPresets';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';
import { isoToTime } from '@/lib/timeUtils';

/**
 * Recurso `/work-time-place` (WorkTimePlaceController): horários de serviço
 * compartilhados de um estabelecimento — listar, adicionar, editar e
 * remover. Também expõe o utilitário `GET /work-time-place/date`.
 */
export function WorkTimePlacePage() {
  const [placeId, setPlaceId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<WorkTime | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error } = useWorkTimesOfPlace(placeId || undefined);
  const removeShared = useRemoveSharedWorkTime();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (workTime: WorkTime) => {
    ask(`Remover o horário "${workTime.shift}" do estabelecimento?`, () => {
      setDeletingId(workTime.id);
      return run(() => removeShared.mutateAsync(workTime.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Horários do Estabelecimento"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Adicionar horário'}
          </Button>
        }
      />

      <Card style={{ marginBottom: 24, maxWidth: 360 }}>
        <div className="form-field">
          <label htmlFor="placeId">Estabelecimento</label>
          <PlaceSelect value={placeId} onChange={setPlaceId} />
        </div>
      </Card>

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          {placeId ? (
            <WorkTimePlaceCreateForm placeId={placeId} onCreated={() => setShowCreate(false)} />
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Informe o ID do estabelecimento acima para habilitar o formulário
              (endpoint <code>POST /work-time-place/me/:id</code>).
            </p>
          )}
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando horário compartilhado de <strong>{editing.shift}</strong>. Deixe um
            campo em branco para não alterá-lo.
          </p>
          <WorkTimePlaceEditForm workTime={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Turno', cell: w => w.shift },
          { header: 'Início', cell: w => w.initHour },
          { header: 'Fim', cell: w => w.endHour },
          { header: 'Duração', cell: w => w.duration },
          { header: 'Padrão?', cell: w => (w.isDefault ? <Badge>padrão</Badge> : '—') },
          {
            header: 'Ações',
            cell: w => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar horário" onClick={() => setEditing(w)} />
                <DeleteIconButton
                  title="Remover horário"
                  isLoading={deletingId === w.id}
                  onClick={() => handleDelete(w)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={w => w.id}
      />

      <DateRangeTool />
    </div>
  );
}

function WorkTimePlaceCreateForm({
  placeId,
  onCreated,
}: {
  placeId: string;
  onCreated: () => void;
}) {
  const addWorkTime = useAddWorkTimeToPlace();

  return (
    <DynamicForm<CreateWorkTimeInput>
      key={`create-${placeId}`}
      schema={createWorkTimeSchema}
      fields={workTimeFields}
      submitLabel="Adicionar horário"
      isSubmitting={addWorkTime.isPending}
      serverError={addWorkTime.error?.message ?? null}
      onSubmit={async values => {
        await addWorkTime.mutateAsync({ placeId, dto: values });
        onCreated();
      }}
    />
  );
}

function WorkTimePlaceEditForm({
  workTime,
  onSaved,
}: {
  workTime: WorkTime;
  onSaved: () => void;
}) {
  const updateShared = useUpdateSharedWorkTime();

  return (
    <DynamicForm<UpdateWorkTimeInput>
      key={`edit-${workTime.id}`}
      schema={updateWorkTimeSchema}
      fields={workTimeFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateShared.isPending}
      serverError={updateShared.error?.message ?? null}
      defaultValues={{
        shift: workTime.shift,
        initHour: isoToTime(workTime.initHour) as never,
        endHour: isoToTime(workTime.endHour) as never,
        isDefault: workTime.isDefault,
      }}
      onSubmit={async values => {
        await updateShared.mutateAsync({ workTimeId: workTime.id, dto: values });
        onSaved();
      }}
    />
  );
}

/** Dropdown com os estabelecimentos cadastrados — extrai o id (UUID). */
function PlaceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = usePlaces();
  const options = useMemo(
    () => (data ?? []).map(p => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    [data],
  );

  return (
    <EntitySelectButton
      id="placeId"
      value={value}
      onChange={onChange}
      options={options}
      title="Estabelecimento"
      placeholder="Usar estabelecimento padrão"
    />
  );
}

/** Pequena ferramenta para o utilitário GET /work-time-place/date. */
function DateRangeTool() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading, error } = useWorkTimePlaceDateRange({ from, to }, enabled);

  return (
    <Card style={{ marginTop: 24 }}>
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
        Utilitário <code>GET /work-time-place/date</code> — converte um período em
        UTC considerando o horário do estabelecimento.
      </p>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className="form-field">
          <label htmlFor="from">De (ISO)</label>
          <Input id="from" value={from} onChange={e => setFrom(e.target.value)} placeholder="2024-01-01T08:00:00" />
        </div>
        <div className="form-field">
          <label htmlFor="to">Até (ISO)</label>
          <Input id="to" value={to} onChange={e => setTo(e.target.value)} placeholder="2024-01-07T18:00:00" />
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        disabled={!from || !to}
        onClick={() => setEnabled(true)}
      >
        Consultar
      </Button>

      {enabled && isLoading && <p style={{ fontSize: 13 }}>Consultando…</p>}
      {enabled && error && <p style={{ fontSize: 13, color: 'var(--color-danger)' }}>{(error as Error).message}</p>}
      {enabled && data && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
              Início (UTC)
            </div>
            <code style={{ display: 'inline-block', marginTop: 4 }}>{data.initDate}</code>
          </div>
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
              Fim (UTC)
            </div>
            <code style={{ display: 'inline-block', marginTop: 4 }}>{data.endDate}</code>
          </div>
        </div>
      )}
    </Card>
  );
}
