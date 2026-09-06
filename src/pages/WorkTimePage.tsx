import { useState } from 'react';
import { useMyWorkTime, useWorkTimes, useUpdateWorkTime, useRemoveWorkTime } from '@/hooks/useWorkTimeQueries';
import { updateWorkTimeSchema, type UpdateWorkTimeInput, type WorkTime } from '@/schemas/workTime.schema';
import { workTimeFields } from '@/components/resource/workTimeFieldPresets';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import { Card } from '@/components/ui/Card';
import { InfoCard } from '@/components/ui/InfoCard';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';
import { isoToTime } from '@/lib/timeUtils';

/**
 * Recurso `/work-time` (WorkTimeController): visão administrativa de TODOS
 * os horários de serviço já existentes no sistema — consulta, edição e
 * exclusão. A criação de um WorkTime acontece por outra porta (ver
 * "Horário do Estabelecimento" ou "Horário do Usuário" no menu), por isso
 * não há formulário de criação aqui — só o que o controller realmente expõe
 * (`GET`, `GET /me`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).
 */
export function WorkTimePage() {
  const [editing, setEditing] = useState<WorkTime | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useWorkTimes();
  const { data: myWorkTime } = useMyWorkTime();
  const removeWorkTime = useRemoveWorkTime();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (workTime: WorkTime) => {
    ask(`Excluir o horário "${workTime.shift}" (${workTime.initHour}–${workTime.endHour})?`, () => {
      setDeletingId(workTime.id);
      return run(() => removeWorkTime.mutateAsync(workTime.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader title="Horários de Serviço (Admin)" />

      {myWorkTime && (
        <InfoCard label="Meu horário atual">
          {myWorkTime.shift} — {myWorkTime.initHour} às {myWorkTime.endHour} (duração{' '}
          {myWorkTime.duration}){myWorkTime.isDefault && <Badge style={{ marginLeft: 6 }}>padrão</Badge>}
        </InfoCard>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando horário de <strong>{editing.shift}</strong>. Deixe um campo em
            branco para não alterá-lo.
          </p>
          <WorkTimeEditForm workTime={editing} onSaved={() => setEditing(null)} />
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
            header: 'Compartilhado?',
            cell: w => (w.isShared ? <Badge>compartilhado</Badge> : '—'),
          },
          {
            header: 'Ações',
            cell: w => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar horário" onClick={() => setEditing(w)} />
                <DeleteIconButton
                  title="Excluir horário"
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
    </div>
  );
}

function WorkTimeEditForm({ workTime, onSaved }: { workTime: WorkTime; onSaved: () => void }) {
  const updateWorkTime = useUpdateWorkTime();

  return (
    <DynamicForm<UpdateWorkTimeInput>
      key={`edit-${workTime.id}`}
      schema={updateWorkTimeSchema}
      fields={workTimeFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateWorkTime.isPending}
      serverError={updateWorkTime.error?.message ?? null}
      defaultValues={{
        shift: workTime.shift,
        initHour: isoToTime(workTime.initHour) as never,
        endHour: isoToTime(workTime.endHour) as never,
        isDefault: workTime.isDefault,
      }}
      onSubmit={async values => {
        await updateWorkTime.mutateAsync({ id: workTime.id, dto: values });
        onSaved();
      }}
    />
  );
}
