import { useState } from 'react';
import { usePlaces, useCreatePlace, useUpdatePlace, useRemovePlace } from '@/hooks/usePlaceQueries';
import {
  createPlaceSchema,
  updatePlaceSchema,
  type CreatePlaceInput,
  type Place,
  type UpdatePlaceInput,
} from '@/schemas/place.schema';
import { shiftOptions } from '@/types/enums';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';

const baseFields: FieldConfig[] = [
  { name: 'name', label: 'Nome fantasia', type: 'text', group: 'Estabelecimento' },
  { name: 'businessName', label: 'Razão social', type: 'text', group: 'Estabelecimento' },
  { name: 'cnpj', label: 'CNPJ', type: 'text', group: 'Estabelecimento' },
  { name: 'cpf', label: 'CPF (opcional)', type: 'text', group: 'Estabelecimento' },
  { name: 'phone', label: 'Telefone', type: 'tel', group: 'Estabelecimento' },
  { name: 'secondPhone', label: 'Telefone 2 (opcional)', type: 'tel', group: 'Estabelecimento' },
  { name: 'email', label: 'E-mail', type: 'email', group: 'Estabelecimento' },
  { name: 'code', label: 'Código único', type: 'text', group: 'Estabelecimento' },
];

const createFields: FieldConfig[] = [
  ...baseFields,

  { name: 'address.street', label: 'Rua', type: 'text', group: 'Endereço' },
  { name: 'address.number', label: 'Número (opcional)', type: 'text', group: 'Endereço' },
  { name: 'address.neighborhood', label: 'Bairro', type: 'text', group: 'Endereço' },
  { name: 'address.postalCode', label: 'CEP', type: 'text', group: 'Endereço' },
  { name: 'address.city', label: 'Cidade', type: 'text', group: 'Endereço' },
  { name: 'address.stateCode', label: 'UF', type: 'text', group: 'Endereço' },
  { name: 'address.complement', label: 'Complemento (opcional)', type: 'text', group: 'Endereço' },
  { name: 'address.referencePoint', label: 'Ponto de referência (opcional)', type: 'text', group: 'Endereço' },

  {
    name: 'workTime.shift',
    label: 'Turno padrão',
    type: 'select',
    options: shiftOptions.map(s => ({ value: s, label: s })),
    group: 'Horário de serviço',
  },
  { name: 'workTime.initHour', label: 'Início', type: 'time', group: 'Horário de serviço' },
  { name: 'workTime.endHour', label: 'Fim', type: 'time', group: 'Horário de serviço' },
];

export function PlacesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = usePlaces();
  const removePlace = useRemovePlace();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (place: Place) => {
    ask(`Excluir o estabelecimento "${place.name}" (${place.code})?`, () => {
      setDeletingId(place.id);
      return run(() => removePlace.mutateAsync(place.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Estabelecimentos"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Novo estabelecimento'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <PlaceCreateForm onCreated={() => setShowCreate(false)} />
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando <strong>{editing.name}</strong>. Endereço e horário de serviço não
            são editados por aqui (deixe um campo em branco para não alterá-lo).
          </p>
          <PlaceEditForm place={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Código', cell: p => p.code },
          { header: 'Nome', cell: p => p.name },
          { header: 'Razão social', cell: p => p.businessName },
          { header: 'CNPJ', cell: p => p.cnpj },
          { header: 'Telefone', cell: p => p.phone },
          {
            header: 'Ações',
            cell: p => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar estabelecimento" onClick={() => setEditing(p)} />
                <DeleteIconButton
                  title="Excluir estabelecimento"
                  isLoading={deletingId === p.id}
                  onClick={() => handleDelete(p)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={p => p.id}
      />
    </div>
  );
}

function PlaceCreateForm({ onCreated }: { onCreated: () => void }) {
  const createPlace = useCreatePlace();

  return (
    <DynamicForm<CreatePlaceInput>
      key="create"
      schema={createPlaceSchema}
      fields={createFields}
      submitLabel="Criar estabelecimento"
      isSubmitting={createPlace.isPending}
      serverError={createPlace.error?.message ?? null}
      onSubmit={async values => {
        await createPlace.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function PlaceEditForm({ place, onSaved }: { place: Place; onSaved: () => void }) {
  const updatePlace = useUpdatePlace();

  return (
    <DynamicForm<UpdatePlaceInput>
      key={`edit-${place.id}`}
      schema={updatePlaceSchema}
      fields={baseFields}
      submitLabel="Salvar alterações"
      isSubmitting={updatePlace.isPending}
      serverError={updatePlace.error?.message ?? null}
      defaultValues={{
        name: place.name,
        businessName: place.businessName,
        cnpj: place.cnpj,
        cpf: place.cpf as never,
        phone: place.phone,
        secondPhone: place.secondPhone as never,
        email: place.email,
        code: place.code,
      }}
      onSubmit={async values => {
        await updatePlace.mutateAsync({ id: place.id, dto: values });
        onSaved();
      }}
    />
  );
}
