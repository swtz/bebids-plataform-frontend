import { useState } from 'react';
import { useIntervalTimes, useCreateIntervalTimeForMe } from '@/hooks/useIntervalTimeQueries';
import {
  createIntervalTimeSchema,
  type CreateIntervalTimeInput,
} from '@/schemas/intervalTime.schema';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const fields: FieldConfig[] = [
  { name: 'initHour', label: 'Início (ISO, ex.: 2024-01-01T12:00:00)', type: 'text' },
  { name: 'endHour', label: 'Fim (ISO, ex.: 2024-01-01T13:00:00)', type: 'text' },
];

export function IntervalTimesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, error } = useIntervalTimes();

  return (
    <div>
      <PageHeader
        title="Horários de Intervalo"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Novo intervalo (meu)'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Cria um intervalo vinculado ao horário de serviço do usuário
            logado (<code>POST /work-time-user/me/interval-time</code>).
          </p>
          <IntervalTimeCreateForm onCreated={() => setShowCreate(false)} />
        </Card>
      )}

      <DataTable
        columns={[
          { header: 'Início', cell: i => i.initHour },
          { header: 'Fim', cell: i => i.endHour },
          { header: 'Duração', cell: i => i.duration },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={i => i.id}
      />
    </div>
  );
}

function IntervalTimeCreateForm({ onCreated }: { onCreated: () => void }) {
  const createIntervalTime = useCreateIntervalTimeForMe();

  return (
    <DynamicForm<CreateIntervalTimeInput>
      schema={createIntervalTimeSchema}
      fields={fields}
      submitLabel="Criar intervalo"
      isSubmitting={createIntervalTime.isPending}
      serverError={createIntervalTime.error?.message ?? null}
      onSubmit={async values => {
        await createIntervalTime.mutateAsync(values);
        onCreated();
      }}
    />
  );
}
