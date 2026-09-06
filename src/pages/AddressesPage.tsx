import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAddresses, useUpdateAddress, useRemoveAddress } from '@/hooks/useAddressQueries';
import { updateAddressSchema, type Address, type UpdateAddressInput } from '@/schemas/address.schema';
import { PageHeader } from '@/components/resource/PageHeader';
import { DataTable } from '@/components/resource/DataTable';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';

const fields: FieldConfig[] = [
  { name: 'street', label: 'Rua', type: 'text' },
  { name: 'number', label: 'Número', type: 'text' },
  { name: 'neighborhood', label: 'Bairro', type: 'text' },
  { name: 'postalCode', label: 'CEP', type: 'text' },
  { name: 'city', label: 'Cidade', type: 'text' },
  { name: 'stateCode', label: 'UF', type: 'text' },
  { name: 'complement', label: 'Complemento', type: 'text' },
  { name: 'referencePoint', label: 'Ponto de referência', type: 'text' },
  { name: 'isDefault', label: 'Endereço padrão', type: 'checkbox' },
];

export function AddressesListPage() {
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useAddresses();
  const removeAddress = useRemoveAddress();
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  // Vem de outra tela (ex.: "Endereços" de um Cliente) apontando direto
  // pra edição de um endereço específico via ?edit=<id>.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !data) return;
    const match = data.find(a => a.id === editId);
    if (match) setEditing(match);
    setSearchParams(params => {
      params.delete('edit');
      return params;
    }, { replace: true });
  }, [searchParams, data, setSearchParams]);

  const handleDelete = (address: Address) => {
    ask(`Excluir o endereço "${address.street}"?`, () => {
      setDeletingId(address.id);
      return run(() => removeAddress.mutateAsync(address.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader title="Endereços" />
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: -8 }}>
        Endereços são criados junto de um Cliente ou Estabelecimento (
        <code>GET /address</code> aqui só lista e permite editar/excluir os já
        cadastrados).
      </p>

      {editing && (
        <Card style={{ margin: '16px 0 24px' }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando endereço em <strong>{editing.street}</strong>. Deixe um campo em
            branco para não alterá-lo.
          </p>
          <AddressEditForm address={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Rua', cell: a => a.street },
          { header: 'Número', cell: a => a.number || '—' },
          { header: 'Bairro', cell: a => a.neighborhood },
          { header: 'Cidade/UF', cell: a => `${a.city}/${a.stateCode}` },
          { header: 'CEP', cell: a => a.postalCode },
          { header: 'Padrão?', cell: a => (a.isDefault ? <Badge>padrão</Badge> : '—') },
          {
            header: 'Ações',
            cell: a => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar endereço" onClick={() => setEditing(a)} />
                <DeleteIconButton
                  title="Excluir endereço"
                  isLoading={deletingId === a.id}
                  onClick={() => handleDelete(a)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={a => a.id}
      />
    </div>
  );
}

function AddressEditForm({ address, onSaved }: { address: Address; onSaved: () => void }) {
  const updateAddress = useUpdateAddress();

  return (
    <DynamicForm<UpdateAddressInput>
      key={`edit-${address.id}`}
      schema={updateAddressSchema}
      fields={fields}
      submitLabel="Salvar alterações"
      isSubmitting={updateAddress.isPending}
      serverError={updateAddress.error?.message ?? null}
      defaultValues={{
        street: address.street,
        number: address.number as never,
        neighborhood: address.neighborhood,
        postalCode: address.postalCode,
        city: address.city,
        stateCode: address.stateCode,
        complement: address.complement as never,
        referencePoint: address.referencePoint as never,
        isDefault: address.isDefault,
      }}
      onSubmit={async values => {
        await updateAddress.mutateAsync({ id: address.id, dto: values });
        onSaved();
      }}
    />
  );
}
