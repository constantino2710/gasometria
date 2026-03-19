import type { SelectHTMLAttributes } from 'react'

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>

export function SelectInput(props: SelectInputProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${props.className ?? ''}`}
    />
  )
}
