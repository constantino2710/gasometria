import type { TextareaHTMLAttributes } from 'react'

type TextAreaInputProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextAreaInput(props: TextAreaInputProps) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${props.className ?? ''}`}
    />
  )
}
