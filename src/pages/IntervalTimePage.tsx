import { useMemo, useState } from 'react';
import {
  useIntervalTimes,
  useMyIntervalTime,
  useCreateIntervalTimeForMe,
  useCreateIntervalTimeForEntity,
  useUpdateIntervalTime,
  useRemoveIntervalTime,
} from '@/hooks/useIntervalTimeQueries';
import { useUsers } from '@/hooks/useUserQueries';
import {
  createIntervalTimeSchema,
  updateIntervalTimeSchema,
  type CreateIntervalTimeInput,
  type IntervalTime,
  type UpdateIntervalTimeInput,
} from '@/schemas/intervalTime.schema';
import { intervalTimeFields } from '@/components/resource/workTimeFieldPresets';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InfoCard } from '@/components/ui/InfoCard';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';
import { isoToTime } from '@/lib/timeUtils';

/** Dropdown com todos os usuários — usado para criar intervalo em nome de outro. */
function useUserOptions() {
  const { data } = useUsers();
  return useMemo(
    () => (data ?? []).map(u => ({ value: u.id, label: `${u.nickname} — ${u.name} ${u.lastName}` })),
    [data],
  );
}

type CreateMode = 'me' | 'user';

/**
 * Recurso IntervalTime por inteiro, reunido numa única página — mesmo as
 * duas rotas de criação vivendo no `WorkTimeUserController` do backend
 * (`POST /work-time-user/me/interval-time` e
 * `POST /work-time-user/interval-time/:id`), pois conceitualmente são
 * operações sobre IntervalTime, não sobre WorkTime. Consulta, edição e
 * exclusão vêm do `IntervalTimeController` (`/interval-time`).
 */
export function IntervalTimePage() {
  const [createMode, setCreateMode] = useState<CreateMode | null>(null);
  const [editing, setEditing] = useState<IntervalTime | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useIntervalTimes();
  const { data: myIntervalTime } = useMyIntervalTime();
  const removeIntervalTime = useRemoveIntervalTime();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (intervalTime: IntervalTime) => {
    ask(`Excluir o intervalo ${intervalTime.initHour}–${intervalTime.endHour}?`, () => {
      setDeletingId(intervalTime.id);
      return run(() => removeIntervalTime.mutateAsync(intervalTime.id)).finally(() => setDeletingId(null));
    });
  };

  /** "Melhor esforço": só dá pra saber o dono com segurança quando o
   * horário associado NÃO é compartilhado — ver comentário no schema. */
  const ownerLabel = (intervalTime: IntervalTime) => {
    const users = intervalTime.workTime?.users;
    if (!users || users.length === 0) return '—';
    if (users.length > 1) return `Compartilhado (${users.length} usuários)`;
    const u = users[0];
    return `${u.name} ${u.lastName} · ${u.phone}`;
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Horários de Intervalo"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={createMode === 'me' ? 'primary' : 'secondary'}
              onClick={() => setCreateMode(m => (m === 'me' ? null : 'me'))}
            >
              Criar meu intervalo
            </Button>
            <Button
              variant={createMode === 'user' ? 'primary' : 'secondary'}
              onClick={() => setCreateMode(m => (m === 'user' ? null : 'user'))}
            >
              Criar para um usuário
            </Button>
          </div>
        }
      />

      {myIntervalTime && (
        <InfoCard label="Meu intervalo atual">
          {myIntervalTime.initHour} às {myIntervalTime.endHour} (duração {myIntervalTime.duration})
        </InfoCard>
      )}

      {createMode === 'me' && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <code>POST /work-time-user/me/interval-time</code> — cria um intervalo
            vinculado ao horário de serviço do usuário logado.
          </p>
          <CreateMyIntervalTimeForm onCreated={() => setCreateMode(null)} />
        </Card>
      )}

      {createMode === 'user' && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <code>POST /work-time-user/interval-time/:id</code>
          </p>
          <CreateIntervalTimeForUserForm onCreated={() => setCreateMode(null)} />
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando intervalo. Deixe um campo em branco para não alterá-lo.
          </p>
          <IntervalTimeEditForm intervalTime={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Dono', cell: ownerLabel },
          { header: 'Início', cell: i => i.initHour },
          { header: 'Fim', cell: i => i.endHour },
          { header: 'Duração', cell: i => i.duration },
          { header: 'Criado em', cell: i => new Date(i.createdAt).toLocaleString('pt-BR') },
          { header: 'Atualizado em', cell: i => new Date(i.updatedAt).toLocaleString('pt-BR') },
          {
            header: 'Ações',
            cell: i => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar intervalo" onClick={() => setEditing(i)} />
                <DeleteIconButton
                  title="Excluir intervalo"
                  isLoading={deletingId === i.id}
                  onClick={() => handleDelete(i)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={i => i.id}
      />
    </div>
  );
}

function CreateMyIntervalTimeForm({ onCreated }: { onCreated: () => void }) {
  const createForMe = useCreateIntervalTimeForMe();

  return (
    <DynamicForm<CreateIntervalTimeInput>
      key="create-my-interval"
      schema={createIntervalTimeSchema}
      fields={intervalTimeFields}
      submitLabel="Criar intervalo"
      isSubmitting={createForMe.isPending}
      serverError={createForMe.error?.message ?? null}
      onSubmit={async values => {
        await createForMe.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function CreateIntervalTimeForUserForm({ onCreated }: { onCreated: () => void }) {
  const [userId, setUserId] = useState('');
  const userOptions = useUserOptions();
  const createForEntity = useCreateIntervalTimeForEntity();

  return (
    <div>
      <div className="form-field" style={{ marginBottom: 16, maxWidth: 360 }}>
        <label htmlFor="intervalUserId">Usuário</label>
        <EntitySelectButton
          id="intervalUserId"
          value={userId}
          onChange={setUserId}
          options={userOptions}
          title="Usuário"
        />
      </div>

      {userId ? (
        <DynamicForm<CreateIntervalTimeInput>
          key={`create-interval-${userId}`}
          schema={createIntervalTimeSchema}
          fields={intervalTimeFields}
          submitLabel="Criar intervalo"
          isSubmitting={createForEntity.isPending}
          serverError={createForEntity.error?.message ?? null}
          onSubmit={async values => {
            await createForEntity.mutateAsync({ userId, dto: values });
            onCreated();
          }}
        />
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Selecione o usuário para habilitar o formulário.
        </p>
      )}
    </div>
  );
}

function IntervalTimeEditForm({
  intervalTime,
  onSaved,
}: {
  intervalTime: IntervalTime;
  onSaved: () => void;
}) {
  const updateIntervalTime = useUpdateIntervalTime();

  return (
    <DynamicForm<UpdateIntervalTimeInput>
      key={`edit-${intervalTime.id}`}
      schema={updateIntervalTimeSchema}
      fields={intervalTimeFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateIntervalTime.isPending}
      serverError={updateIntervalTime.error?.message ?? null}
      defaultValues={{
        initHour: isoToTime(intervalTime.initHour) as never,
        endHour: isoToTime(intervalTime.endHour) as never,
      }}
      onSubmit={async values => {
        await updateIntervalTime.mutateAsync({ id: intervalTime.id, dto: values });
        onSaved();
      }}
    />
  );
}
