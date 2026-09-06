import { useMemo, useState } from 'react';
import { useSetWorkTimeToUser, useSetSharedWorkTimeToUser } from '@/hooks/useWorkTimeUserQueries';
import { useUsers } from '@/hooks/useUserQueries';
import { useWorkTimes } from '@/hooks/useWorkTimeQueries';
import { createWorkTimeSchema, type CreateWorkTimeInput } from '@/schemas/workTime.schema';
import { workTimeFields } from '@/components/resource/workTimeFieldPresets';
import { PageHeader } from '@/components/resource/PageHeader';
import { DynamicForm } from '@/components/resource/DynamicForm';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

/** Dropdown com todos os usuários — usado nos 2 cartões que pedem um userId. */
function useUserOptions() {
  const { data } = useUsers();
  return useMemo(
    () => (data ?? []).map(u => ({ value: u.id, label: `${u.nickname} — ${u.name} ${u.lastName}` })),
    [data],
  );
}

/** Dropdown com todos os horários de serviço já cadastrados. */
function useWorkTimeOptions() {
  const { data } = useWorkTimes();
  return useMemo(
    () =>
      (data ?? []).map(w => ({
        value: w.id,
        label: `${w.shift} — ${w.initHour} às ${w.endHour}${w.isDefault ? ' (padrão)' : ''}`,
      })),
    [data],
  );
}

function UserSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = useUserOptions();
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <Select id={id} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

/**
 * Recurso `/work-time-user` (WorkTimeUserController), restrito às operações
 * sobre WorkTime (via WorkTimePlaceUserService) — as ações de IntervalTime
 * desse mesmo controller (`POST .../me/interval-time` e
 * `POST .../interval-time/:id`) ficam na página "Horário de Intervalo",
 * junto com o resto do que envolve IntervalTime no sistema.
 *   PUT /work-time-user/:id                       → definir horário exclusivo
 *   PUT /work-time-user/shared/:userId/:workTimeId → atribuir horário existente
 */
export function WorkTimeUserPage() {
  return (
    <div>
      <PageHeader title="Horário do Usuário" />
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: -8, marginBottom: 24 }}>
        Este recurso não tem listagem própria — são ações diretas sobre um
        usuário específico, escolhido pelo nome (o ID é extraído para você).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SetWorkTimeToUserCard />
        <SetSharedWorkTimeToUserCard />
      </div>
    </div>
  );
}

function SetWorkTimeToUserCard() {
  const [userId, setUserId] = useState('');
  const setWorkTime = useSetWorkTimeToUser();
  const [done, setDone] = useState(false);

  return (
    <Card>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Definir horário exclusivo</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -6 }}>
        <code>PUT /work-time-user/:id</code> — cria um horário novo só para este usuário
        (substitui o que ele já tinha).
      </p>

      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <UserSelect id="setWorkTimeUserId" label="Usuário" value={userId} onChange={setUserId} />
      </div>

      {userId ? (
        <DynamicForm<CreateWorkTimeInput>
          key={`set-worktime-${userId}`}
          schema={createWorkTimeSchema}
          fields={workTimeFields}
          submitLabel="Definir horário"
          isSubmitting={setWorkTime.isPending}
          serverError={setWorkTime.error?.message ?? null}
          onSubmit={async values => {
            await setWorkTime.mutateAsync({ userId, dto: values });
            setDone(true);
          }}
        />
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Selecione o usuário para habilitar o formulário.
        </p>
      )}
      {done && <p style={{ fontSize: 13, color: 'var(--color-success)' }}>Horário definido com sucesso.</p>}
    </Card>
  );
}

function SetSharedWorkTimeToUserCard() {
  const [userId, setUserId] = useState('');
  const [workTimeId, setWorkTimeId] = useState('');
  const setShared = useSetSharedWorkTimeToUser();
  const workTimeOptions = useWorkTimeOptions();

  return (
    <Card>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Atribuir horário já existente</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -6 }}>
        <code>PUT /work-time-user/shared/:userId/:workTimeId</code> — vincula o
        usuário a um horário já cadastrado (compartilhado de um estabelecimento
        ou não).
      </p>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <UserSelect id="sharedUserId" label="Usuário" value={userId} onChange={setUserId} />
        <div className="form-field">
          <label htmlFor="sharedWorkTimeId">Horário</label>
          <Select id="sharedWorkTimeId" value={workTimeId} onChange={e => setWorkTimeId(e.target.value)}>
            <option value="">Selecione…</option>
            {workTimeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {setShared.error && <ErrorMessage message={setShared.error.message} />}
      {setShared.isSuccess && (
        <p style={{ fontSize: 13, color: 'var(--color-success)' }}>Horário atribuído com sucesso.</p>
      )}

      <Button
        type="button"
        disabled={!userId || !workTimeId}
        isLoading={setShared.isPending}
        onClick={() => setShared.mutate({ userId, workTimeId })}
      >
        Atribuir horário
      </Button>
    </Card>
  );
}
