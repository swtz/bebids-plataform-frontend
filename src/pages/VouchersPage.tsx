import { z } from 'zod';
import { uuidSchema } from '@/schemas/common';
import { useMemo, useState } from 'react';
import {
  useVouchers,
  useMyVouchers,
  useCreateVoucher,
  useCreateVoucherForUser,
  useUpdateVoucher,
  useUpdateVoucherForUser,
  useRemoveVoucher,
} from '@/hooks/useVoucherQueries';
import { useDeliveryMen } from '@/hooks/useDeliveryManQueries';
import {
  createVoucherSchema,
  updateVoucherSchema,
  type CreateVoucherInput,
  type UpdateVoucherInput,
  type Voucher,
} from '@/schemas/voucher.schema';
import type { DeliveryMan } from '@/schemas/deliveryMan.schema';
import type { SmallUser } from '@/schemas/user.schema';
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
  { name: 'amount', label: 'Valor (R$)', type: 'number' },
  { name: 'description', label: 'Descrição (opcional, até 30 caracteres)', type: 'text' },
];

/**
 * Cobre o VoucherController por inteiro:
 *   GET  /voucher            → "Todos os adiantamentos" (admin)
 *   GET  /voucher/me         → "Meus adiantamentos"
 *   POST /voucher/me         → criar adiantamento para mim
 *   POST /voucher/me/user/:id → criar adiantamento para um motoboy (dropdown)
 *   PATCH /voucher/me/:id     → editar adiantamento próprio
 *   PATCH /voucher/me/user/:id → editar adiantamento de outro usuário (admin)
 *   DELETE /voucher/me/:id    → excluir (funciona também para adiantamentos de
 *                                 outros, se você for admin/operador — regra do backend)
 */
export function VouchersListPage() {
  const [showCreateMine, setShowCreateMine] = useState(false);
  const [showCreateForUser, setShowCreateForUser] = useState(false);
  const [editingMine, setEditingMine] = useState<Voucher | null>(null);
  const [editingOther, setEditingOther] = useState<Voucher | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myVouchers = useMyVouchers();
  const allVouchers = useVouchers();
  const removeVoucher = useRemoveVoucher();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (voucher: Voucher) => {
    ask(`Excluir o adiantamento de R$ ${Number(voucher.amount).toFixed(2)}?`, () => {
      setDeletingId(voucher.id);
      return run(() => removeVoucher.mutateAsync(voucher.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader title="Adiantamentos / Compras" />

      {actionError && <ErrorMessage message={actionError} />}

      {/* ---------- Meus adiantamentos ---------- */}
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Meus adiantamentos</h2>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => setShowCreateMine(v => !v)}>
          {showCreateMine ? 'Fechar' : 'Novo adiantamento (meu)'}
        </Button>
      </div>

      {showCreateMine && (
        <Card style={{ marginBottom: 24 }}>
          <CreateMineForm onCreated={() => setShowCreateMine(false)} />
        </Card>
      )}

      {editingMine && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando adiantamento de <strong>R$ {Number(editingMine.amount).toFixed(2)}</strong>.
          </p>
          <EditMineForm voucher={editingMine} onSaved={() => setEditingMine(null)} />
        </Card>
      )}

      <DataTable
        columns={[
          { header: 'Valor', cell: v => `R$ ${Number(v.amount).toFixed(2)}` },
          { header: 'Descrição', cell: v => v.description ?? '—' },
          { header: 'Criado em', cell: v => new Date(v.createdAt).toLocaleString('pt-BR') },
          {
            header: 'Ações',
            cell: v => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton title="Editar adiantamento" onClick={() => setEditingMine(v)} />
                <DeleteIconButton
                  title="Excluir adiantamento"
                  isLoading={deletingId === v.id}
                  onClick={() => handleDelete(v)}
                />
              </div>
            ),
          },
        ]}
        data={myVouchers.data}
        isLoading={myVouchers.isLoading}
        error={myVouchers.error as Error | null}
        getRowKey={v => v.id}
      />

      {/* ---------- Criar para um motoboy ---------- */}
      <h2 style={{ fontSize: 16, margin: '32px 0 8px' }}>Lançar adiantamento para um motoboy</h2>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => setShowCreateForUser(v => !v)}>
          {showCreateForUser ? 'Fechar' : 'Novo adiantamento (para motoboy)'}
        </Button>
      </div>
      {showCreateForUser && (
        <Card style={{ marginBottom: 24 }}>
          <CreateForUserForm onCreated={() => setShowCreateForUser(false)} />
        </Card>
      )}

      {/* ---------- Todos os adiantamentos (admin) ---------- */}
      <h2 style={{ fontSize: 16, margin: '32px 0 8px' }}>Todos os adiantamentos (admin)</h2>

      {editingOther && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando adiantamento de <strong>{editingOther.user?.nickname ?? 'usuário'}</strong> — R${' '}
            {Number(editingOther.amount).toFixed(2)}.
          </p>
          <EditForUserForm voucher={editingOther} onSaved={() => setEditingOther(null)} />
        </Card>
      )}

      <DataTable
        columns={[
          { header: 'Usuário', cell: v => v.user?.nickname ?? '—' },
          { header: 'Valor', cell: v => `R$ ${Number(v.amount).toFixed(2)}` },
          { header: 'Descrição', cell: v => v.description ?? '—' },
          { header: 'Criado em', cell: v => new Date(v.createdAt).toLocaleString('pt-BR') },
          { header: 'Criado por', cell: v => v.createdBy?.nickname ?? '—' },
          {
            header: 'Ações',
            cell: v => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton
                  title="Editar adiantamento"
                  onClick={() => setEditingOther(v)}
                />
                <DeleteIconButton
                  title="Excluir adiantamento"
                  isLoading={deletingId === v.id}
                  onClick={() => handleDelete(v)}
                />
              </div>
            ),
          },
        ]}
        data={allVouchers.data}
        isLoading={allVouchers.isLoading}
        error={allVouchers.error as Error | null}
        getRowKey={v => v.id}
      />
    </div>
  );
}

/** Dropdown de motoboys — extrai o id do USUÁRIO (é isso que o backend espera). */
function useMotoboyOptions() {
  const { data } = useDeliveryMen();
  return useMemo(
    () =>
      (data ?? []).map((d: DeliveryMan) => {
        const user = d.user as Partial<SmallUser> | undefined;
        return {
          value: user?.id ?? '',
          label: user ? `${user.nickname} — ${user.name} ${user.lastName}` : d.id,
        };
      }),
    [data],
  );
}

function CreateMineForm({ onCreated }: { onCreated: () => void }) {
  const createVoucher = useCreateVoucher();
  return (
    <DynamicForm<CreateVoucherInput>
      key="create-mine"
      schema={createVoucherSchema}
      fields={baseFields}
      submitLabel="Criar adiantamento"
      isSubmitting={createVoucher.isPending}
      serverError={createVoucher.error?.message ?? null}
      onSubmit={async values => {
        await createVoucher.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

const createForUserSchema = createVoucherSchema.extend({ userId: uuidSchema });
type CreateForUserInput = z.infer<typeof createForUserSchema>;

function CreateForUserForm({ onCreated }: { onCreated: () => void }) {
  const createForUser = useCreateVoucherForUser();
  const motoboyOptions = useMotoboyOptions();

  const fields: FieldConfig[] = [
    { name: 'userId', label: 'Motoboy', type: 'select', options: motoboyOptions },
    ...baseFields,
  ];

  return (
    <DynamicForm<CreateForUserInput>
      key="create-for-user"
      schema={createForUserSchema}
      fields={fields}
      submitLabel="Lançar adiantamento"
      isSubmitting={createForUser.isPending}
      serverError={createForUser.error?.message ?? null}
      onSubmit={async values => {
        const { userId, ...dto } = values;
        await createForUser.mutateAsync({ userId, dto });
        onCreated();
      }}
    />
  );
}

function EditMineForm({ voucher, onSaved }: { voucher: Voucher; onSaved: () => void }) {
  const updateVoucher = useUpdateVoucher();
  return (
    <DynamicForm<UpdateVoucherInput>
      key={`edit-mine-${voucher.id}`}
      schema={updateVoucherSchema}
      fields={baseFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateVoucher.isPending}
      serverError={updateVoucher.error?.message ?? null}
      defaultValues={{ amount: voucher.amount, description: voucher.description as never }}
      onSubmit={async values => {
        await updateVoucher.mutateAsync({ voucherId: voucher.id, dto: values });
        onSaved();
      }}
    />
  );
}

function EditForUserForm({ voucher, onSaved }: { voucher: Voucher; onSaved: () => void }) {
  const updateForUser = useUpdateVoucherForUser();
  return (
    <DynamicForm<UpdateVoucherInput>
      key={`edit-other-${voucher.id}`}
      schema={updateVoucherSchema}
      fields={baseFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateForUser.isPending}
      serverError={updateForUser.error?.message ?? null}
      defaultValues={{ amount: voucher.amount, description: voucher.description as never }}
      onSubmit={async values => {
        if (!voucher.user) return;
        await updateForUser.mutateAsync({
          userId: voucher.user.id,
          voucherId: voucher.id,
          dto: values,
        });
        onSaved();
      }}
    />
  );
}
