import { useMemo, useState } from 'react';
import {
  useDeliveries,
  useCreateDelivery,
  useUpdateDelivery,
  useRemoveDelivery,
} from '@/hooks/useDeliveryQueries';
import { useRemoveTip } from '@/hooks/useTipQueries';
import { useDeliveryMen } from '@/hooks/useDeliveryManQueries';
import { useCustomers } from '@/hooks/useCustomerQueries';
import { useMe } from '@/hooks/useUserQueries';
import { usePlaceCodeOptions } from '@/hooks/usePlaceCodeOptions';
import {
  createDeliverySchema,
  updateDeliverySchema,
  type CreateDeliveryInput,
  type Delivery,
  type UpdateDeliveryInput,
} from '@/schemas/delivery.schema';
import type { DeliveryMan } from '@/schemas/deliveryMan.schema';
import type { Customer } from '@/schemas/customer.schema';
import type { SmallUser } from '@/schemas/user.schema';
import { Role, paymentMethodLabels, paymentMethodOptions } from '@/types/enums';
import { PageHeader } from '@/components/resource/PageHeader';
import { DynamicForm } from '@/components/resource/DynamicForm';
import type { FieldConfig } from '@/components/resource/FieldConfig';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { Input } from '@/components/ui/Input';
import { DeleteIconButton, EditIconButton } from '@/components/ui/IconButton';
import type { QueryParams } from '@/lib/apiClient';
import { useActionError } from '@/hooks/useActionError';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

/** motoboy = id do USUÁRIO do motoboy (não o id do registro DeliveryMan). */
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

function useCustomerOptions() {
  const { data } = useCustomers();
  return useMemo(
    () =>
      (data ?? []).map((c: Customer) => ({
        value: c.id,
        label: `${c.name} ${c.lastName} — ${c.phone}`,
      })),
    [data],
  );
}

function useBaseFields(): FieldConfig[] {
  const motoboyOptions = useMotoboyOptions();
  const customerOptions = useCustomerOptions();
  const placeCodeOptions = usePlaceCodeOptions();

  return [
    { name: 'description', label: 'Descrição (opcional)', type: 'textarea' },
    { name: 'totalPurchase', label: 'Total da compra (R$)', type: 'number' },
    { name: 'deliveryTax', label: 'Taxa de entrega (R$)', type: 'number' },
    {
      name: 'paymentMethod',
      label: 'Forma de pagamento',
      type: 'select',
      options: paymentMethodOptions.map(m => ({ value: m, label: paymentMethodLabels[m] })),
    },
    { name: 'tip', label: 'Gorjeta (opcional, R$)', type: 'number' },
    { name: 'motoboy', label: 'Motoboy', type: 'select', options: motoboyOptions },
    { name: 'customer', label: 'Cliente', type: 'select', options: customerOptions },
    { name: 'placeCode', label: 'Estabelecimento', type: 'select', options: placeCodeOptions },
  ];
}

/** Objeto "não altere nada" — usado como base ao enviar só o `isPaid` no toggle. */
const noopUpdatePatch: UpdateDeliveryInput = {
  description: null,
  totalPurchase: null,
  deliveryTax: null,
  paymentMethod: null,
  tip: null,
  motoboy: null,
  customer: null,
  placeCode: null,
  address: null,
};

/**
 * Campos válidos para `field` em `?field=<x>&order=<asc|desc>` — espelha
 * exatamente `deliveryOrderMap` (campos de Delivery) + `commonOrderMap`
 * (id/createdAt/updatedAt) do backend, que é o que a ParseOrderParamsPipe
 * aceita de verdade para `GET /delivery`.
 */
const orderFieldOptions = [
  { value: 'id', label: 'ID' },
  { value: 'createdAt', label: 'Criado em' },
  { value: 'updatedAt', label: 'Atualizado em' },
  { value: 'deliveryTax', label: 'Taxa de entrega' },
  { value: 'description', label: 'Descrição' },
  { value: 'paymentMethod', label: 'Forma de pagamento' },
  { value: 'placeCode', label: 'Estabelecimento' },
  { value: 'totalPurchase', label: 'Total da compra' },
  { value: 'tip', label: 'Gorjeta' },
  { value: 'isPaid', label: 'Pago' },
  { value: 'address', label: 'Endereço' },
  { value: 'customer', label: 'Cliente' },
  { value: 'motoboy', label: 'Motoboy' },
  { value: 'motorcycleLicensePlate', label: 'Placa da moto' },
  { value: 'operator', label: 'Operador' },
];

interface DeliveryFiltersState {
  type: '' | typeof Role.Operator | typeof Role.Motoboy;
  nickname: string;
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  secondPhone: string;
  placeCode: string;
  motorcycleLicensePlate: string;
  from: string;
  to: string;
  paymentMethod: string;
  isPaid: '' | 'true' | 'false';
  field: string;
  order: 'asc' | 'desc';
}

const emptyFilters: DeliveryFiltersState = {
  type: '',
  nickname: '',
  id: '',
  name: '',
  lastName: '',
  email: '',
  phone: '',
  secondPhone: '',
  placeCode: '',
  motorcycleLicensePlate: '',
  from: '',
  to: '',
  paymentMethod: '',
  isPaid: '',
  field: '',
  order: 'desc',
};

function buildDeliveryQueryParams(filters: DeliveryFiltersState): QueryParams {
  return {
    type: filters.type || undefined,
    nickname: filters.nickname || undefined,
    id: filters.id || undefined,
    name: filters.name || undefined,
    lastName: filters.lastName || undefined,
    email: filters.email || undefined,
    phone: filters.phone || undefined,
    secondPhone: filters.secondPhone || undefined,
    placeCode: filters.placeCode || undefined,
    motorcycleLicensePlate: filters.motorcycleLicensePlate || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    isPaid: filters.isPaid === '' ? undefined : filters.isPaid === 'true',
    field: filters.field || undefined,
    order: filters.field ? filters.order : undefined,
  };
}

function DeliveryFilterPanel({
  filters,
  onChange,
  onApply,
  onClear,
  isFetching,
}: {
  filters: DeliveryFiltersState;
  onChange: (patch: Partial<DeliveryFiltersState>) => void;
  onApply: () => void;
  onClear: () => void;
  isFetching: boolean;
}) {
  const placeCodeOptions = usePlaceCodeOptions();
  const hasUserType = filters.type !== '';

  return (
    <Card style={{ marginBottom: 24 }}>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-field">
          <label htmlFor="filterType">Filtrar por usuário</label>
          <EntitySelectButton
            id="filterType"
            value={filters.type}
            onChange={v => onChange({ type: v as DeliveryFiltersState['type'] })}
            options={[
              { value: '', label: 'Nenhum' },
              { value: Role.Operator, label: 'Operador' },
              { value: Role.Motoboy, label: 'Motoboy' },
            ]}
            title="Filtrar por usuário"
            placeholder="Nenhum"
          />
        </div>
        <div className="form-field">
          <label htmlFor="filterFrom">Criada de</label>
          <Input id="filterFrom" type="date" value={filters.from} onChange={e => onChange({ from: e.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="filterTo">Criada até</label>
          <Input id="filterTo" type="date" value={filters.to} onChange={e => onChange({ to: e.target.value })} />
        </div>
      </div>

      {hasUserType && (
        <fieldset className="fieldset">
          <legend>Dados do {filters.type === Role.Motoboy ? 'motoboy' : 'operador'}</legend>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="filterNickname">Apelido</label>
              <Input id="filterNickname" value={filters.nickname} onChange={e => onChange({ nickname: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterId">ID (UUID)</label>
              <Input id="filterId" value={filters.id} onChange={e => onChange({ id: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterName">Nome</label>
              <Input id="filterName" value={filters.name} onChange={e => onChange({ name: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterLastName">Sobrenome</label>
              <Input id="filterLastName" value={filters.lastName} onChange={e => onChange({ lastName: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterEmail">E-mail</label>
              <Input id="filterEmail" type="email" value={filters.email} onChange={e => onChange({ email: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterPhone">Telefone</label>
              <Input id="filterPhone" type="tel" value={filters.phone} onChange={e => onChange({ phone: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterSecondPhone">Telefone 2</label>
              <Input id="filterSecondPhone" type="tel" value={filters.secondPhone} onChange={e => onChange({ secondPhone: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="filterPlaceCode">Estabelecimento</label>
              <EntitySelectButton
                id="filterPlaceCode"
                value={filters.placeCode}
                onChange={v => onChange({ placeCode: v })}
                options={[{ value: '', label: 'Todos' }, ...placeCodeOptions]}
                title="Estabelecimento"
                placeholder="Todos"
              />
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className="fieldset">
        <legend>Entrega</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="filterPlate">Placa da moto</label>
            <Input
              id="filterPlate"
              value={filters.motorcycleLicensePlate}
              onChange={e => onChange({ motorcycleLicensePlate: e.target.value })}
              placeholder="ABC-1234"
            />
          </div>
          <div className="form-field">
            <label htmlFor="filterPaymentMethod">Forma de pagamento</label>
            <EntitySelectButton
              id="filterPaymentMethod"
              value={filters.paymentMethod}
              onChange={v => onChange({ paymentMethod: v })}
              options={[
                { value: '', label: 'Todas' },
                ...paymentMethodOptions.map(m => ({ value: m, label: paymentMethodLabels[m] })),
              ]}
              title="Forma de pagamento"
              placeholder="Todas"
            />
          </div>
          <div className="form-field">
            <label htmlFor="filterIsPaid">Pagamento</label>
            <EntitySelectButton
              id="filterIsPaid"
              value={filters.isPaid}
              onChange={v => onChange({ isPaid: v as DeliveryFiltersState['isPaid'] })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Pago' },
                { value: 'false', label: 'Não pago' },
              ]}
              title="Pagamento"
              placeholder="Todos"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Ordenar por</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="filterField">Campo</label>
            <EntitySelectButton
              id="filterField"
              value={filters.field}
              onChange={v => onChange({ field: v })}
              options={[{ value: '', label: 'Padrão (criado em, mais recentes)' }, ...orderFieldOptions]}
              title="Ordenar por"
              placeholder="Padrão (criado em, mais recentes)"
            />
          </div>
          <div className="form-field">
            <label htmlFor="filterOrder">Direção</label>
            <EntitySelectButton
              id="filterOrder"
              value={filters.order}
              onChange={v => onChange({ order: v as 'asc' | 'desc' })}
              disabled={!filters.field}
              options={[
                { value: 'asc', label: 'Crescente' },
                { value: 'desc', label: 'Decrescente' },
              ]}
              title="Direção"
            />
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <Button type="button" isLoading={isFetching} onClick={onApply}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="secondary" onClick={onClear}>
          Limpar
        </Button>
      </div>
    </Card>
  );
}

export function DeliveriesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DeliveryFiltersState>(emptyFilters);
  const [appliedParams, setAppliedParams] = useState<QueryParams | undefined>(undefined);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { data, isLoading, isFetching, error } = useDeliveries(appliedParams);
  const { data: me } = useMe();
  const removeDelivery = useRemoveDelivery();
  const updateDelivery = useUpdateDelivery();
  const removeTip = useRemoveTip();
  const [removingTipId, setRemovingTipId] = useState<string | null>(null);
  const { error: actionError, run } = useActionError();
  const { ask, dialog } = useConfirmDialog();

  // Espelha a regra real do backend (delivery.service.ts#findOneOwnedBy):
  // um motoboy só edita/exclui as entregas em que ELE é o motoboy; qualquer
  // outra pessoa (operador/admin) só edita/exclui as que ELA MESMA criou
  // como operadora — nem admin tem um bypass geral. Mostrar os botões fora
  // dessa regra levava ao erro "Entrega não encontrada" ao clicar.
  const isLoggedUserMotoboy = me?.roles?.includes(Role.Motoboy) ?? false;
  const canManage = (delivery: Delivery) =>
    isLoggedUserMotoboy ? delivery.motoboy?.id === me?.id : delivery.operator?.id === me?.id;

  const handleRemoveTip = (tipId: string) => {
    ask('Remover a gorjeta desta entrega?', () => {
      setRemovingTipId(tipId);
      return run(() => removeTip.mutateAsync(tipId)).finally(() => setRemovingTipId(null));
    });
  };

  const handleDelete = (delivery: Delivery) => {
    ask('Excluir esta entrega? Essa ação não pode ser desfeita.', () => {
      setDeletingId(delivery.id);
      return run(() => removeDelivery.mutateAsync(delivery.id)).finally(() => setDeletingId(null));
    });
  };

  const handleTogglePaid = (delivery: Delivery) => {
    setTogglingId(delivery.id);
    run(() =>
      updateDelivery.mutateAsync({
        id: delivery.id,
        dto: { ...noopUpdatePatch, isPaid: !delivery.isPaid },
      }),
    ).finally(() => setTogglingId(null));
  };

  return (
    <div>
      {dialog}
      <PageHeader
        title="Entregas"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowFilters(v => !v)}>
              {showFilters ? 'Fechar filtros' : 'Filtros'}
            </Button>
            <Button onClick={() => setShowCreate(v => !v)}>
              {showCreate ? 'Fechar' : 'Nova entrega'}
            </Button>
          </div>
        }
      />

      {showFilters && (
        <DeliveryFilterPanel
          filters={draftFilters}
          onChange={patch => setDraftFilters(prev => ({ ...prev, ...patch }))}
          isFetching={isFetching}
          onApply={() => setAppliedParams(buildDeliveryQueryParams(draftFilters))}
          onClear={() => {
            setDraftFilters(emptyFilters);
            setAppliedParams(undefined);
          }}
        />
      )}

      {showCreate && (
        <Card style={{ marginBottom: 24 }}>
          <DeliveryCreateForm onCreated={() => setShowCreate(false)} />
        </Card>
      )}

      {editing && (
        <Card style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            Editando entrega. Deixe um campo em branco para não alterá-lo.
          </p>
          <DeliveryEditForm delivery={editing} onSaved={() => setEditing(null)} />
        </Card>
      )}

      {isLoading && <Spinner />}
      {error && <ErrorMessage message={error.message} />}
      {actionError && <ErrorMessage message={actionError} />}

      {!isLoading && !error && (!data || data.length === 0) && (
        <p className="text-muted">Nenhuma entrega encontrada.</p>
      )}

      <div className="delivery-grid">
        {data?.map(delivery => (
          <div className="card elev-sm" key={delivery.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <strong style={{ fontSize: 14 }}>{delivery.description || 'Entrega sem descrição'}</strong>
              <button
                type="button"
                onClick={() => handleTogglePaid(delivery)}
                disabled={togglingId === delivery.id}
                title="Clique para alternar"
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
              >
                <Badge variant={delivery.isPaid ? 'accent-2' : 'neutral'}>
                  {togglingId === delivery.id ? '...' : delivery.isPaid ? 'Pago' : 'Não pago'}
                </Badge>
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--color-text)', opacity: 0.85 }}>
              Total R$ {Number(delivery.totalPurchase).toFixed(2)} · Taxa R${' '}
              {Number(delivery.deliveryTax).toFixed(2)} · {delivery.paymentMethod ?? '—'}
            </div>

            {delivery.tip && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span>Gorjeta: R$ {Number(delivery.tip.amount).toFixed(2)}</span>
                <DeleteIconButton
                  title="Remover gorjeta"
                  isLoading={removingTipId === delivery.tip.id}
                  onClick={() => handleRemoveTip(delivery.tip!.id)}
                />
              </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Estabelecimento: {delivery.placeCode}
            </div>

            <div className="hr" style={{ margin: '4px 0' }} />

            {/* Participantes — em formato de lista, com nome + telefone. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Operador: </span>
                {delivery.operator ? (
                  <>
                    {delivery.operator.name} {delivery.operator.lastName} ·{' '}
                    <span className="text-muted">{delivery.operator.phone}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Motoboy: </span>
                {delivery.motoboy ? (
                  <>
                    {delivery.motoboy.name} {delivery.motoboy.lastName} ·{' '}
                    <span className="text-muted">{delivery.motoboy.phone}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>

            {canManage(delivery) && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <EditIconButton title="Editar entrega" onClick={() => setEditing(delivery)} />
                <DeleteIconButton
                  title="Excluir entrega"
                  isLoading={deletingId === delivery.id}
                  onClick={() => handleDelete(delivery)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliveryCreateForm({ onCreated }: { onCreated: () => void }) {
  const createDelivery = useCreateDelivery();
  const fields = useBaseFields();

  return (
    <DynamicForm<CreateDeliveryInput>
      key="create"
      schema={createDeliverySchema}
      fields={fields}
      submitLabel="Criar entrega"
      isSubmitting={createDelivery.isPending}
      serverError={createDelivery.error?.message ?? null}
      onSubmit={async values => {
        await createDelivery.mutateAsync(values);
        onCreated();
      }}
    />
  );
}

function DeliveryEditForm({ delivery, onSaved }: { delivery: Delivery; onSaved: () => void }) {
  const updateDelivery = useUpdateDelivery();
  const baseFields = useBaseFields();
  const fields: FieldConfig[] = [...baseFields, { name: 'isPaid', label: 'Pago', type: 'checkbox' }];

  return (
    <DynamicForm<UpdateDeliveryInput>
      key={`edit-${delivery.id}`}
      schema={updateDeliverySchema}
      fields={fields}
      submitLabel="Salvar alterações"
      isSubmitting={updateDelivery.isPending}
      serverError={updateDelivery.error?.message ?? null}
      defaultValues={{
        description: delivery.description as never,
        totalPurchase: delivery.totalPurchase,
        deliveryTax: delivery.deliveryTax,
        paymentMethod: delivery.paymentMethod as never,
        motoboy: delivery.motoboy?.id ?? ('' as never),
        customer: delivery.customer?.id ?? ('' as never),
        placeCode: delivery.placeCode,
        isPaid: delivery.isPaid,
      }}
      onSubmit={async values => {
        await updateDelivery.mutateAsync({ id: delivery.id, dto: values });
        onSaved();
      }}
    />
  );
}
