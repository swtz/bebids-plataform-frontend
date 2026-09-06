import { useState } from 'react';
import {
  useMotorcycles,
  useCreateMotorcycle,
  useUpdateMotorcycle,
  useRemoveMotorcycle,
} from '@/hooks/useMotorcycleQueries';
import {
  createMotorcycleSchema,
  updateMotorcycleSchema,
  type CreateMotorcycleInput,
  type Motorcycle,
  type UpdateMotorcycleInput,
} from '@/schemas/motorcycle.schema';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';

function useFields(): FieldConfig[] {
  const placeCodeOptions = usePlaceCodeOptions();
  return [
    { name: 'licensePlate', label: 'Placa', type: 'text', placeholder: 'ABC-1234' },
    { name: 'brand', label: 'Marca', type: 'text' },
    { name: 'model', label: 'Modelo', type: 'text' },
    { name: 'year', label: 'Ano', type: 'text', placeholder: '2022' },
    { name: 'displacement', label: 'Cilindrada (opcional)', type: 'text', placeholder: '150' },
    { name: 'color', label: 'Cor', type: 'text' },
    {
      name: 'placeCode',
      label: 'Estabelecimento (opcional)',
      type: 'select',
      options: placeCodeOptions,
    },
    { name: 'isActive', label: 'Ativa', type: 'checkbox' },
  ];
}

export function MotorcyclesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Motorcycle | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useMotorcycles();
  const removeMotorcycle = useRemoveMotorcycle();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (motorcycle: Motorcycle) => {
    ask(`Excluir a motocicleta placa "${motorcycle.licensePlate}"?`, () => {
      setDeletingId(motorcycle.id);
      return run(() => removeMotorcycle.mutateAsync(motorcycle.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Motocicletas"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Nova motocicleta'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <MotorcycleCreateForm onCreated={() => setShowCreate(false)} />
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando placa <strong>{editing.licensePlate}</strong>. Deixe um campo em
            branco para não alterá-lo.
          </p>
          <MotorcycleEditForm motorcycle={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {isLoading && <Spinner />}
      {error && <ErrorMessage message={(error as Error).message} />}
      {actionError && <ErrorMessage message={actionError} />}
      {!isLoading && !error && (!data || data.length === 0) && (
        <p className="text-muted">Nenhuma motocicleta cadastrada.</p>
      )}

      <div className="entity-grid">
        {data?.map(m => (
          <div className="card elev-sm" key={m.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <strong style={{ fontSize: 14 }}>{m.licensePlate}</strong>
              {m.isActive ? <Badge variant="accent-2">ativa</Badge> : <Badge variant="neutral">inativa</Badge>}
            </div>

            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {m.brand} {m.model} · {m.color} · {m.year}
              {m.displacement && ` · ${m.displacement}cc`}
            </div>

            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Estabelecimento: {m.placeCode ?? '—'}
            </div>

            <div className="hr" style={{ margin: '4px 0' }} />

            {/* Owner/driver — em formato de lista, com nome + telefone. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Proprietário: </span>
                {m.owner ? (
                  <>
                    {m.owner.name} {m.owner.lastName} · <span className="text-muted">{m.owner.phone}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Condutor: </span>
                {m.driver ? (
                  <>
                    {m.driver.name} {m.driver.lastName} · <span className="text-muted">{m.driver.phone}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <EditIconButton title="Editar motocicleta" onClick={() => setEditing(m)} />
              <DeleteIconButton
                title="Excluir motocicleta"
                isLoading={deletingId === m.id}
                onClick={() => handleDelete(m)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MotorcycleCreateForm({ onCreated }: { onCreated: () => void }) {
  const createMotorcycle = useCreateMotorcycle();
  const fields = useFields();

  return (
    <DynamicForm<CreateMotorcycleInput>
      key="create"
      schema={createMotorcycleSchema}
      fields={fields}
      submitLabel="Criar motocicleta"
      isSubmitting={createMotorcycle.isPending}
      serverError={createMotorcycle.error?.message ?? null}
      onSubmit={async values => {
        await createMotorcycle.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function MotorcycleEditForm({
  motorcycle,
  onSaved,
}: {
  motorcycle: Motorcycle;
  onSaved: () => void;
}) {
  const updateMotorcycle = useUpdateMotorcycle();
  const fields = useFields();

  return (
    <DynamicForm<UpdateMotorcycleInput>
      key={`edit-${motorcycle.id}`}
      schema={updateMotorcycleSchema}
      fields={fields}
      submitLabel="Salvar alterações"
      isSubmitting={updateMotorcycle.isPending}
      serverError={updateMotorcycle.error?.message ?? null}
      defaultValues={{
        licensePlate: motorcycle.licensePlate,
        brand: motorcycle.brand,
        model: motorcycle.model,
        year: motorcycle.year,
        displacement: motorcycle.displacement as never,
        color: motorcycle.color,
        placeCode: motorcycle.placeCode as never,
        isActive: motorcycle.isActive,
      }}
      onSubmit={async values => {
        await updateMotorcycle.mutateAsync({ id: motorcycle.id, dto: values });
        onSaved();
      }}
    />
  );
}
