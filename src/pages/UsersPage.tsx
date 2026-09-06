import { useState } from 'react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useRemoveUser,
} from '@/hooks/useUserQueries';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type User,
} from '@/schemas/user.schema';
import { roleLabels, roleOptions } from '@/types/enums';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
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
import { toFormValue } from '@/lib/formUtils';

function useUserFields(): { createFields: FieldConfig[]; editFields: FieldConfig[] } {
  const placeCodeOptions = usePlaceCodeOptions();

  const createFields: FieldConfig[] = [
    { name: 'name', label: 'Nome', type: 'text' },
    { name: 'lastName', label: 'Sobrenome', type: 'text' },
    { name: 'nickname', label: 'Apelido', type: 'text' },
    { name: 'phone', label: 'Telefone', type: 'tel', placeholder: '(48) 99999-9999' },
    { name: 'secondPhone', label: 'Telefone 2 (opcional)', type: 'tel' },
    { name: 'email', label: 'E-mail (opcional)', type: 'email' },
    {
      name: 'role',
      label: 'Função',
      type: 'select',
      options: roleOptions.map(role => ({ value: role, label: roleLabels[role] })),
    },
    { name: 'password', label: 'Senha', type: 'password' },
    { name: 'placeCode', label: 'Estabelecimento', type: 'select', options: placeCodeOptions },
  ];

  // Edição não permite trocar senha nem função (mesmas regras do UpdateUserDto
  // do backend, que omite "password" e "role" de CreateUserDto).
  const editFields = createFields.filter(f => f.name !== 'password' && f.name !== 'role');

  return { createFields, editFields };
}

type Mode = { type: 'idle' } | { type: 'create' } | { type: 'edit'; user: User };

export function UsersListPage() {
  const [mode, setMode] = useState<Mode>({ type: 'idle' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading, error } = useUsers();
  const removeUser = useRemoveUser();
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  const handleDelete = (user: User) => {
    ask(`Excluir o usuário "${user.name} ${user.lastName}"? Essa ação não pode ser desfeita.`, () => {
      setDeletingId(user.id);
      return run(() => removeUser.mutateAsync(user.id)).finally(() => setDeletingId(null));
    });
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Usuários"
        action={
          <Button
            onClick={() =>
              setMode(m => (m.type === 'create' ? { type: 'idle' } : { type: 'create' }))
            }
          >
            {mode.type === 'create' ? 'Fechar' : 'Novo usuário'}
          </Button>
        }
      />

      {mode.type === 'create' && (
        <Card style={{ marginBottom: 24 }}>
          <UserCreateForm onCreated={() => setMode({ type: 'idle' })} />
        </Card>
      )}

      {mode.type === 'edit' && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando <strong>{mode.user.nickname}</strong>. Senha e função não são
            alteradas por aqui. Alterar apelido, telefone, e-mail ou
            estabelecimento faz esse usuário precisar entrar de novo (o backend
            invalida a sessão atual dele automaticamente por segurança).
          </p>
          <UserEditForm user={mode.user} onSaved={() => setMode({ type: 'idle' })} />
        </Card>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      <DataTable
        columns={[
          { header: 'Nome', cell: u => `${u.name} ${u.lastName}` },
          { header: 'Apelido', cell: u => u.nickname },
          { header: 'Telefone', cell: u => u.phone },
          { header: 'Estabelecimento', cell: u => u.placeCode },
          {
            header: 'Papéis',
            cell: u => u.roles?.map(r => roleLabels[r] ?? r).join(', ') ?? '—',
          },
          {
            header: 'Ações',
            cell: u => (
              <div style={{ display: 'flex', gap: 6 }}>
                <EditIconButton
                  title="Editar usuário"
                  onClick={() => setMode({ type: 'edit', user: u })}
                />
                <DeleteIconButton
                  title="Excluir usuário"
                  isLoading={deletingId === u.id}
                  onClick={() => handleDelete(u)}
                />
              </div>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        error={error as Error | null}
        getRowKey={u => u.id}
      />
    </div>
  );
}

function UserCreateForm({ onCreated }: { onCreated: () => void }) {
  const createUser = useCreateUser();
  const { createFields } = useUserFields();

  return (
    <DynamicForm<CreateUserInput>
      key="create"
      schema={createUserSchema}
      fields={createFields}
      submitLabel="Criar usuário"
      isSubmitting={createUser.isPending}
      serverError={createUser.error?.message ?? null}
      onSubmit={async values => {
        await createUser.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function UserEditForm({ user, onSaved }: { user: User; onSaved: () => void }) {
  const updateUser = useUpdateUser();
  const { editFields } = useUserFields();

  return (
    <DynamicForm<UpdateUserInput>
      // key força o react-hook-form a remontar com os defaultValues do
      // usuário certo sempre que a edição mudar de linha.
      key={`edit-${user.id}`}
      schema={updateUserSchema}
      fields={editFields}
      submitLabel="Salvar alterações"
      isSubmitting={updateUser.isPending}
      serverError={updateUser.error?.message ?? null}
      defaultValues={{
        name: user.name,
        lastName: user.lastName,
        nickname: user.nickname,
        phone: user.phone,
        secondPhone: toFormValue(user.secondPhone) as never,
        email: toFormValue(user.email) as never,
        placeCode: user.placeCode,
      }}
      onSubmit={async values => {
        // IMPORTANTE: o backend faz `user.forceLogout = true` (derrubando a
        // sessão daquele usuário) sempre que nickname/phone/secondPhone/email/
        // placeCode chegam preenchidos no PATCH — mesmo que o valor seja
        // idêntico ao atual. Como o formulário pré-preenche esses campos
        // (para exibir o valor existente), reenviá-los sempre que o usuário
        // não mexeu neles dispararia um logout forçado sem necessidade. Por
        // isso, só mandamos cada um desses 5 campos quando ele REALMENTE
        // mudou — do contrário vai `null` ("não alterar", como já fazemos
        // para todo campo em branco).
        const dto: UpdateUserInput = {
          ...values,
          nickname: values.nickname !== user.nickname ? values.nickname : null,
          phone: values.phone !== user.phone ? values.phone : null,
          secondPhone:
            values.secondPhone !== (user.secondPhone ?? '') ? values.secondPhone : null,
          email: values.email !== (user.email ?? '') ? values.email : null,
          placeCode: values.placeCode !== user.placeCode ? values.placeCode : null,
        };
        await updateUser.mutateAsync({ id: user.id, dto });
        onSaved();
      }}
    />
  );
}
