import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { Input, InputProps } from '@/components/ui/Input'

interface PhoneInputProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChange' | 'name'> {
  name: Path<T>
  control: Control<T>
  prefix?: string
  rules?: any
}


export function PhoneInput<T extends FieldValues>({
  name,
  control,
  prefix = '+221',
  label,
  placeholder,
  icon,
  error,
  rules,
  type,
  className,
  ...props
}: PhoneInputProps<T>) {
  const prefixDigits = prefix.replace(/\D/g, '')

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={prefix as any}
      rules={rules}
      render={({ field }) => {
        const value = field.value ?? ''
        const rawValue = value.startsWith(prefix) ? value.slice(prefix.length) : value.replace(/\D/g, '')

        return (
          <Input
            label={label}
            icon={icon}
            prefix={prefix}
            placeholder={placeholder}
            error={error}
            type={type}
            className={className}
            value={rawValue}
            onChange={(event) => {
              let digits = event.target.value.replace(/\D/g, '')
              if (digits.startsWith(prefixDigits)) {
                digits = digits.slice(prefixDigits.length)
              }
              field.onChange(prefix + digits)
            }}
            onBlur={field.onBlur}
            {...props}
          />
        )
      }}
    />
  )
}

PhoneInput.displayName = 'PhoneInput'
