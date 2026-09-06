import { useState } from 'react';
import { useWorkTimes, useAddWorkTimeToPlace } from '@/hooks/useWorkTimeQueries';
import { createWorkTimeSchema, type CreateWorkTimeInput } from '@/schemas/workTime.schema';
import { shiftOptions } from '@/types/enums';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const fields: FieldConfig[] = [
  {
    name: 'shift',
    label: 'Turno',
    type: 'select',
    options: shiftOptions.map(s => ({ value: s, label: s })),
  },
  { name: 'initHour', label: 'Início (ISO, ex.: 2024-01-01T08:00:00)', type: 'text' },
  { name: 'endHour', label: 'Fim (ISO, ex.: 2024-01-01T18:00:00)', type: 'text' },
  { name: 'isDefault', label: 'Turno padrão do estabelecimento', type: 'checkbox' },
];

export function WorkTimesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [placeId, setPlaceId] = useState('');
  const { data, isLoading, error } = useWorkTimes();

  return (
    <div>
      <PageHeader
        title="Horários de Serviço"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Adicionar a um estabelecimento'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <div className="form-field" style={{ marginBottom: 16, maxWidth: 320 }}>
            <label htmlFor="placeId">ID do estabelecimento (UUID)</label>
            <Input
              id="placeId"
              value={placeId}
              onChange={e => setPlaceId(e.target.value)}
              placeholder="cole aqui o id do place"
            />
          </div>
          {placeId ? (
            <WorkTimeCreateForm placeId={placeId} onCreated={() => setShowCreate(false)} />
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Informe o id do estabelecimento para habilitar o formulário
              (endpoint <code>POST /work-time-place/me/:id</code>).
            </p>
          )}
        </Card>
      )}

      <DataTable
        columns={[
          { header: 'Turno', cell: w => w.shift },
          { header: 'Início', cell: w => w.initHour },
          { header: 'Fim', cell: w => w.endHour },
          { header: 'Duração', cell: w => w.duration },
          {
            header: 'Padrão?',
            cell: w => (w.isDefault ? <Badge>padrão</Badge> : '—'),
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

function WorkTimeCreateForm({
  placeId,
  onCreated,
}: {
  placeId: string;
  onCreated: () => void;
}) {
  const addWorkTime = useAddWorkTimeToPlace();

  return (
    <DynamicForm<CreateWorkTimeInput>
      schema={createWorkTimeSchema}
      fields={fields}
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
