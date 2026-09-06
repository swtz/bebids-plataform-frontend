import { useMemo, useState } from 'react';
import {
  useDeliveryMen,
  useCreateDeliveryMan,
  useCreateDeliveryManWithExistingMotorcycle,
  useUpdateDeliveryMan,
} from '@/hooks/useDeliveryManQueries';
import { useMotorcycles } from '@/hooks/useMotorcycleQueries';
import { usePlaces } from '@/hooks/usePlaceQueries';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
import { Role, roleLabels, roleOptions } from '@/types/enums';
import {
  createDeliveryManSchema,
  createDeliveryManWithExistingMotorcycleSchema,
  updateDeliveryManSchema,
  type CreateDeliveryManInput,
  type CreateDeliveryManWithExistingMotorcycleInput,
  type DeliveryMan,
  type UpdateDeliveryManInput,
} from '@/schemas/deliveryMan.schema';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { EditIconButton } from '@/components/ui/IconButton';
import type { User } from '@/schemas/user.schema';
import type { Motorcycle } from '@/schemas/motorcycle.schema';

// Campos aninhados: "user.*" e "motorcycle.*" viram objetos automaticamente
// pelo react-hook-form (register aceita path com ponto). A mesma ordem e
// estrutura de campos da feature de Criar Usuário — inclusive "Função" —
// já que o backend usa o CreateUserDto por inteiro aqui também.
function useUserFields(): FieldConfig[] {
  const placeCodeOptions = usePlaceCodeOptions();
  return [
    { name: 'user.name', label: 'Nome', type: 'text', group: 'Dados pessoais' },
    { name: 'user.lastName', label: 'Sobrenome', type: 'text', group: 'Dados pessoais' },
    { name: 'user.nickname', label: 'Apelido', type: 'text', group: 'Dados pessoais' },
    { name: 'user.phone', label: 'Telefone', type: 'tel', group: 'Dados pessoais' },
    { name: 'user.secondPhone', label: 'Telefone 2 (opcional)', type: 'tel', group: 'Dados pessoais' },
    { name: 'user.email', label: 'E-mail (opcional)', type: 'email', group: 'Dados pessoais' },
    {
      name: 'user.role',
      label: 'Função',
      type: 'select',
      options: roleOptions.map(role => ({ value: role, label: roleLabels[role] })),
      group: 'Dados pessoais',
    },
    { name: 'user.password', label: 'Senha', type: 'password', group: 'Dados pessoais' },
    {
      name: 'user.placeCode',
      label: 'Estabelecimento',
      type: 'select',
      options: placeCodeOptions,
      group: 'Dados pessoais',
    },
  ];
}

const motorcycleFields: FieldConfig[] = [
  { name: 'motorcycle.licensePlate', label: 'Placa', type: 'text', group: 'Motocicleta (nova)' },
  { name: 'motorcycle.brand', label: 'Marca', type: 'text', group: 'Motocicleta (nova)' },
  { name: 'motorcycle.model', label: 'Modelo', type: 'text', group: 'Motocicleta (nova)' },
  { name: 'motorcycle.year', label: 'Ano', type: 'text', group: 'Motocicleta (nova)' },
  { name: 'motorcycle.color', label: 'Cor', type: 'text', group: 'Motocicleta (nova)' },
  { name: 'motorcycle.displacement', label: 'Cilindrada (opcional)', type: 'text', group: 'Motocicleta (nova)' },
];

const dailyField: FieldConfig[] = [
  { name: 'deliveryMan.daily', label: 'Diária (R$)', type: 'number', group: 'Contrato' },
];

const editFields: FieldConfig[] = [
  ...motorcycleFields.map(f => ({ ...f, group: 'Motocicleta' })),
  { name: 'daily', label: 'Diária (R$)', type: 'number', group: 'Contrato' },
];

type CreateMode = 'new-motorcycle' | 'existing-motorcycle';

export function MotoboysListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState<CreateMode>('new-motorcycle');
  const [editing, setEditing] = useState<DeliveryMan | null>(null);
  const { data, isLoading, error } = useDeliveryMen();

  return (
    <div>
      <PageHeader
        title="Motoboys"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Novo motoboy'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <Button
              type="button"
              variant={mode === 'new-motorcycle' ? 'primary' : 'secondary'}
              onClick={() => setMode('new-motorcycle')}
            >
              Cadastrar moto nova
            </Button>
            <Button
              type="button"
              variant={mode === 'existing-motorcycle' ? 'primary' : 'secondary'}
              onClick={() => setMode('existing-motorcycle')}
            >
              Usar moto existente
            </Button>
          </div>

          {mode === 'new-motorcycle' ? (
            <MotoboyCreateForm onCreated={() => setShowCreate(false)} />
          ) : (
            <MotoboyCreateWithExistingMotorcycleForm onCreated={() => setShowCreate(false)} />
          )}
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando moto/diária de <strong>{(editing.user as Partial<User> | undefined)?.nickname ?? 'motoboy'}</strong>.
            Deixe um campo em branco para não alterá-lo.
          </p>
          <MotoboyEditForm deliveryMan={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      <DataTable
        columns={[
          {
            header: 'Nome',
            cell: (d: DeliveryMan) => {
              const user = d.user as Partial<User> | undefined;
              return user ? `${user.name ?? ''} ${user.lastName ?? ''}` : '—';
            },
          },
          {
            header: 'Apelido',
            cell: (d: DeliveryMan) => (d.user as Partial<User> | undefined)?.nickname ?? '—',
          },
          {
            header: 'Placa',
            cell: (d: DeliveryMan) =>
              (d.motorcycle as Partial<Motorcycle> | undefined)?.licensePlate ?? '—',
          },
          { header: 'Diária', cell: d => `R$ ${Number(d.daily).toFixed(2)}` },
          {
            header: 'Ações',
            cell: d => <EditIconButton title="Editar moto/diária" onClick={() => setEditing(d)} />,
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={d => d.id}
      />
    </div>
  );
}

function MotoboyCreateForm({ onCreated }: { onCreated: () => void }) {
  const createDeliveryMan = useCreateDeliveryMan();
  const userFields = useUserFields();
  const newMotorcycleFields = [...userFields, ...motorcycleFields, ...dailyField];

  return (
    <DynamicForm<CreateDeliveryManInput>
      key="new-motorcycle"
      schema={createDeliveryManSchema}
      fields={newMotorcycleFields}
      submitLabel="Criar motoboy"
      isSubmitting={createDeliveryMan.isPending}
      serverError={createDeliveryMan.error?.message ?? null}
      defaultValues={{ user: { role: Role.Motoboy } } as never}
      onSubmit={async values => {
        await createDeliveryMan.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

const restOfSchema = createDeliveryManWithExistingMotorcycleSchema.omit({ motorcycleId: true });

function MotoboyEditForm({
  deliveryMan,
  onSaved,
}: {
  deliveryMan: DeliveryMan;
  onSaved: () => void;
}) {
  const updateDeliveryMan = useUpdateDeliveryMan();
  const motorcycle = deliveryMan.motorcycle as Partial<Motorcycle> | undefined;

  return (
    <DynamicForm<UpdateDeliveryManInput>
      key={`edit-${deliveryMan.id}`}
      schema={updateDeliveryManSchema}
      fields={editFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateDeliveryMan.isPending}
      serverError={updateDeliveryMan.error?.message ?? null}
      defaultValues={{
        motorcycle: {
          licensePlate: motorcycle?.licensePlate,
          brand: motorcycle?.brand,
          model: motorcycle?.model,
          year: motorcycle?.year,
          color: motorcycle?.color,
          displacement: motorcycle?.displacement,
        } as never,
        daily: deliveryMan.daily,
      }}
      onSubmit={async values => {
        await updateDeliveryMan.mutateAsync({ id: deliveryMan.id, dto: values });
        onSaved();
      }}
    />
  );
}

function MotoboyCreateWithExistingMotorcycleForm({ onCreated }: { onCreated: () => void }) {
  const [motorcycleId, setMotorcycleId] = useState('');
  const { data: motorcycles } = useMotorcycles();
  const { data: places } = usePlaces();
  const createWithExisting = useCreateDeliveryManWithExistingMotorcycle();
  const userFields = useUserFields();
  const existingMotorcycleFields = [...userFields, ...dailyField];

  const options = useMemo(
    () =>
      (motorcycles ?? [])
        // uma moto que já tem motoboy dono não deveria aparecer aqui, mas o
        // preview não tem essa informação na listagem — mostramos todas.
        .map((m: Motorcycle) => ({
          value: m.id,
          label: `${m.licensePlate} — ${m.brand} ${m.color}`,
        })),
    [motorcycles],
  );

  const selected = motorcycles?.find(m => m.id === motorcycleId);
  const selectedPlace = selected?.placeCode
    ? places?.find(p => p.cnpj === selected.placeCode)
    : undefined;

  return (
    <div>
      <div className="form-field" style={{ marginBottom: 20, maxWidth: 360 }}>
        <label htmlFor="existingMotorcycle">Motocicleta</label>
        <EntitySelectButton
          id="existingMotorcycle"
          value={motorcycleId}
          onChange={setMotorcycleId}
          options={options}
          title="Motocicleta"
        />
        {selected?.placeCode && (
          <p style={{ fontSize: 12, color: 'var(--color-accent-700)', marginTop: 4 }}>
            Esta moto ({selected.licensePlate}) pertence ao estabelecimento{' '}
            <strong>{selectedPlace?.name ?? selected.placeCode}</strong>.
          </p>
        )}
      </div>

      {motorcycleId ? (
        <DynamicForm<Omit<CreateDeliveryManWithExistingMotorcycleInput, 'motorcycleId'>>
          key={`existing-motorcycle-${motorcycleId}`}
          schema={restOfSchema}
          fields={existingMotorcycleFields}
          submitLabel="Criar motoboy"
          isSubmitting={createWithExisting.isPending}
          serverError={createWithExisting.error?.message ?? null}
          defaultValues={{ user: { role: Role.Motoboy } } as never}
          onSubmit={async values => {
            await createWithExisting.mutateAsync({ motorcycleId, ...values });
            onCreated();
          }}
        />
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Selecione uma motocicleta cadastrada para habilitar o formulário.
        </p>
      )}
    </div>
  );
}
