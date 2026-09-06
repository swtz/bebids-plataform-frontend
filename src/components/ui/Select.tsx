import { forwardRef, type SelectHTMLAttributes } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    const { className, ...rest } = props;
    return <select ref={ref} {...rest} className={['input', className].filter(Boolean).join(' ')} />;
  },
);
