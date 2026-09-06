export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'tel'
  | 'password'
  | 'checkbox'
  | 'select'
  | 'datetime-local'
  | 'time'
  | 'textarea';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  /** Caminho do campo — aceita notação com ponto para objetos aninhados (ex.: "address.street"). */
  name: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  placeholder?: string;
  /** Quando definido, agrupa o campo dentro de um <fieldset> com essa legenda. */
  group?: string;
  helperText?: string;
}
