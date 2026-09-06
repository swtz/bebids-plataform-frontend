import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type FieldValues } from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EntitySelectButton } from '@/components/ui/EntitySelectButton';
import { timeToIso } from '@/lib/timeUtils';
import type { FieldConfig } from './FieldConfig';

interface DynamicFormProps<T extends FieldValues> {
  // O terceiro parâmetro (Input) fica em `any`: schemas com `optionalNullable`
  // usam `z.preprocess`, cujo tipo de entrada bruta é `unknown` (o valor cru
  // do <input>), diferente do tipo de saída `T` já validado/transformado.
  schema: ZodType<T, ZodTypeDef, any>;
  fields: FieldConfig[];
  defaultValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
}

function getError(errors: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  const message = (current as { message?: string } | undefined)?.message;
  return message;
}

export function DynamicForm<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar',
  isSubmitting,
  serverError,
}: DynamicFormProps<T>) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as never,
  });

  const groups = new Map<string | undefined, FieldConfig[]>();
  for (const field of fields) {
    const list = groups.get(field.group) ?? [];
    list.push(field);
    groups.set(field.group, list);
  }

  const renderField = (field: FieldConfig) => {
    const errorMessage = getError(errors as Record<string, unknown>, field.name);
    // Campos "time": o <input type="time"> só entrega "HH:mm" — setValueAs
    // converte para ISO8601 completo (data de referência fixa) no exato
    // momento em que o react-hook-form lê o valor para validar/enviar, sem
    // precisar de um componente controlado à parte.
    const registration =
      field.type === 'time'
        ? register(field.name as never, { setValueAs: (v: string) => timeToIso(v) })
        : register(field.name as never);

    return (
      <div className="form-field" key={field.name}>
        <label htmlFor={field.name}>{field.label}</label>
        {field.type === 'select' ? (
          // Todo campo "select" — entidade ou enum, em qualquer tamanho de
          // tela — vira um EntitySelectButton (bottom-sheet no mobile,
          // drawer da direita no desktop) em vez do <select> nativo. Um
          // mecanismo só, dentro do DynamicForm, em vez de reimplementar
          // isso em cada tela.
          <Controller
            name={field.name as never}
            control={control}
            render={({ field: rhfField }) => (
              <EntitySelectButton
                id={field.name}
                value={rhfField.value ?? ''}
                onChange={rhfField.onChange}
                options={field.options ?? []}
                title={field.label}
              />
            )}
          />
        ) : field.type === 'checkbox' ? (
          <Checkbox id={field.name} {...registration} />
        ) : field.type === 'textarea' ? (
          <textarea
            id={field.name}
            placeholder={field.placeholder}
            {...registration}
            className="input"
            style={{ minHeight: 90, fontFamily: 'inherit' }}
          />
        ) : (
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            step={field.type === 'number' ? '0.01' : undefined}
            {...registration}
          />
        )}
        {field.helperText && !errorMessage && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {field.helperText}
          </span>
        )}
        {errorMessage && <span className="error">{errorMessage}</span>}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(async values => onSubmit(values))}
      noValidate
    >
      {serverError && <ErrorMessage message={serverError} />}

      {[...groups.entries()].map(([group, groupFields]) =>
        group ? (
          <fieldset className="fieldset" key={group}>
            <legend>{group}</legend>
            <div className="form-grid">{groupFields.map(renderField)}</div>
          </fieldset>
        ) : (
          <div className="form-grid" key="ungrouped">
            {groupFields.map(renderField)}
          </div>
        ),
      )}

      <div className="form-actions">
        <Button type="submit" isLoading={isSubmitting || isFormSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
