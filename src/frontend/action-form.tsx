'use client'

import { startTransition, useActionState, type FormEvent, type ReactNode } from 'react'
import type { FormResult } from '../shared/forms'

type Props = {
  action: (previous: FormResult, data: FormData) => Promise<FormResult>
  children: ReactNode
  submitLabel: string
}

export function ActionForm({ action, children, submitLabel }: Props) {
  const [result, dispatch, pending] = useActionState(action, {})

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }

  if (result.success) return <p className="feature-notice" role="status">{result.success}</p>

  return (
    <form action={dispatch} onSubmit={submit} className="feature-form">
      {children}
      {result.error && <p className="feature-error" role="alert">{result.error}</p>}
      <button className="feature-button" disabled={pending}>{pending ? 'Guardando…' : submitLabel}</button>
    </form>
  )
}
