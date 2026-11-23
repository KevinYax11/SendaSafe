'use server'

import { submitComment } from '../../backend/community'
import { storageEnabled } from '../../backend/storage'
import { countryCode, textField, type FormResult } from '../../shared/forms'

export async function submitCommunityComment(_result: FormResult, data: FormData): Promise<FormResult> {
  if (!storageEnabled()) return { error: 'La comunidad no está disponible en este sitio.' }
  const country = countryCode(textField(data, 'country'))
  if (!country) return { error: 'Selecciona el país para continuar.' }
  const success = 'Recibimos tu comentario. Aparecerá en la comunidad si el equipo lo aprueba.'
  if (textField(data, 'website')) return { success }
  const body = textField(data, 'body')
  const length = Array.from(body).length
  if (length < 10 || length > 1000 || /[\u0000-\u0008\u000b-\u001f]/u.test(body.replaceAll('\r', ''))) {
    return { error: 'Escribe un comentario de entre 10 y 1,000 caracteres de texto.' }
  }
  if (!await submitComment(country, body)) return { error: 'Ya recibimos este texto o hay muchos envíos en este país. Inténtalo en unos minutos.' }
  return { success }
}
