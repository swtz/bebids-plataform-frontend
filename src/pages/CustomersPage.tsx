import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useRemoveCustomer,
  useAddCustomerAddress,
  useRemoveCustomerAddress,
} from '@/hooks/useCustomerQueries';
import {
  createCustomerWithAddressSchema,
  updateCustomerSchema,
  type CreateCustomerWithAddressInput,
  type Customer,
  type UpdateCustomerInput,
} from '@/schemas/customer.schema';
import { createAddressSchema, type Address, type CreateAddressInput } from '@/schemas/address.schema';
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

const customerFields: FieldConfig[] = [
  { name: 'customer.name', label: 'Nome', type: 'text', group: 'Cliente' },
  { name: 'customer.lastName', label: 'Sobrenome', type: 'text', group: 'Cliente' },
  { name: 'customer.nickname', label: 'Apelido', type: 'text', group: 'Cliente' },
  { name: 'customer.phone', label: 'Telefone', type: 'tel', group: 'Cliente' },
  { name: 'customer.secondPhone', label: 'Telefone 2 (opcional)', type: 'tel', group: 'Cliente' },
  { name: 'customer.email', label: 'E-mail (opcional)', type: 'email', group: 'Cliente' },
];

const addressFields: FieldConfig[] = [
  { name: 'address.street', label: 'Rua', type: 'text', group: 'Endereço' },
  { name: 'address.number', label: 'Número (opcional)', type: 'text', group: 'Endereço' },
  { name: 'address.neighborhood', label: 'Bairro', type: 'text', group: 'Endereço' },
  { name: 'address.postalCode', label: 'CEP', type: 'text', group: 'Endereço' },
  { name: 'address.city', label: 'Cidade', type: 'text', group: 'Endereço' },
  { name: 'address.stateCode', label: 'UF', type: 'text', group: 'Endereço' },
  { name: 'address.complement', label: 'Complemento (opcional)', type: 'text', group: 'Endereço' },
  { name: 'address.referencePoint', label: 'Ponto de referência (opcional)', type: 'text', group: 'Endereço' },
];

const createFields: FieldConfig[] = [...customerFields, ...addressFields];
const editFields: FieldConfig[] = customerFields.map(f => ({
  ...f,
  name: f.name.replace('customer.', ''),
}));

export function CustomersListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [managingAddresses, setManagingAddresses] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useCustomers();
  const removeCustomer = useRemoveCustomer();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (customer: Customer) => {
    ask(`Excluir o cliente "${customer.name} ${customer.lastName}"?`, () => {
      setDeletingId(customer.id);
      return run(() => removeCustomer.mutateAsync(customer.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Clientes"
        action={
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Fechar' : 'Novo cliente'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <CustomerCreateForm onCreated={() => setShowCreate(false)} />
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando <strong>{editing.nickname}</strong>. Deixe um campo em branco para
            não alterá-lo. Endereços são gerenciados separadamente (botão "Endereços" na
            linha da tabela).
          </p>
          <CustomerEditForm customer={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {managingAddresses && (
        <Card style={{ marginBottom: 24 }}>
          <CustomerAddressesManager
            customer={managingAddresses}
            onClose={() => setManagingAddresses(null)}
          />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Nome', cell: c => `${c.name} ${c.lastName}` },
          { header: 'Apelido', cell: c => c.nickname },
          { header: 'Telefone', cell: c => c.phone },
          { header: 'E-mail', cell: c => c.email ?? '—' },
          {
            header: 'Endereços',
            cell: c => (
              <button
                type="button"
                onClick={() => setManagingAddresses(c)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--color-accent-700)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                {Array.isArray(c.addresses) ? c.addresses.length : 0} endereço(s)
              </button>
            ),
          },
          {
            header: 'Ações',
            cell: c => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar cliente" onClick={() => setEditing(c)} />
                <DeleteIconButton
                  title="Excluir cliente"
                  isLoading={deletingId === c.id}
                  onClick={() => handleDelete(c)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={c => c.id}
      />
    </div>
  );
}

function CustomerCreateForm({ onCreated }: { onCreated: () => void }) {
  const createCustomer = useCreateCustomer();

  return (
    <DynamicForm<CreateCustomerWithAddressInput>
      key="create"
      schema={createCustomerWithAddressSchema}
      fields={createFields}
      submitLabel="Criar cliente"
      isSubmitting={createCustomer.isPending}
      serverError={createCustomer.error?.message ?? null}
      onSubmit={async values => {
        await createCustomer.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function CustomerEditForm({ customer, onSaved }: { customer: Customer; onSaved: () => void }) {
  const updateCustomer = useUpdateCustomer();

  return (
    <DynamicForm<UpdateCustomerInput>
      key={`edit-${customer.id}`}
      schema={updateCustomerSchema}
      fields={editFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateCustomer.isPending}
      serverError={updateCustomer.error?.message ?? null}
      defaultValues={{
        name: customer.name,
        lastName: customer.lastName,
        nickname: customer.nickname,
        phone: customer.phone,
        secondPhone: customer.secondPhone as never,
        email: customer.email as never,
      }}
      onSubmit={async values => {
        await updateCustomer.mutateAsync({ id: customer.id, dto: values });
        onSaved();
      }}
    />
  );
}

function CustomerAddressesManager({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeAddress = useRemoveCustomerAddress();
  const addresses = (customer.addresses as Address[] | null) ?? [];
  const navigate = useNavigate();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleRemove = (address: Address) => {
    ask(`Remover o endereço "${address.street}"?`, () => {
      setRemovingId(address.id);
      return run(() => removeAddress.mutateAsync(address.id)).finally(() => setRemovingId(null));
    });
  };

  return (
    <>
      {dialog}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          Endereços de <strong>{customer.nickname}</strong>
        </p>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
        Clique num endereço para editá-lo na tela de Endereços.
      </p>

      {actionError && <ErrorMessage message={actionError} />}

      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 16px' }}>
        {addresses.length === 0 && (
          <li style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Nenhum endereço cadastrado.</li>
        )}
        {addresses.map(address => (
          <li
            key={address.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 14,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(`/addresses?edit=${address.id}`)}
              title="Editar este endereço na tela de Endereços"
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--color-accent-700)',
              }}
            >
              {address.street}, {address.number || 's/n'} — {address.neighborhood},{' '}
              {address.city}/{address.stateCode}
              {address.isDefault && ' (padrão)'}
            </button>
            <DeleteIconButton
              title="Remover endereço"
              isLoading={removingId === address.id}
              onClick={() => handleRemove(address)}
            />
          </li>
        ))}
      </ul>

      <Button variant="secondary" onClick={() => setShowAdd(v => !v)}>
        {showAdd ? 'Fechar' : 'Adicionar endereço'}
      </Button>

      {showAdd && (
        <div style={{ marginTop: 16 }}>
          <AddCustomerAddressForm
            customerId={customer.id}
            onAdded={() => setShowAdd(false)}
          />
        </div>
      )}
    </div>
    </>
  );
}

const plainAddressFields: FieldConfig[] = [
  ...addressFields.map(f => ({
    ...f,
    name: f.name.replace('address.', ''),
  })),
  { name: 'isDefault', label: 'Definir como endereço padrão', type: 'checkbox' },
];

function AddCustomerAddressForm({
  customerId,
  onAdded,
}: {
  customerId: string;
  onAdded: () => void;
}) {
  const addAddress = useAddCustomerAddress();

  return (
    <DynamicForm<CreateAddressInput>
      key={`add-address-${customerId}`}
      schema={createAddressSchema}
      fields={plainAddressFields}
      submitLabel="Adicionar endereço"
      isSubmitting={addAddress.isPending}
      serverError={addAddress.error?.message ?? null}
      onSubmit={async values => {
        await addAddress.mutateAsync({ customerId, dto: values });
        onAdded();
      }}
    />
  );
}
