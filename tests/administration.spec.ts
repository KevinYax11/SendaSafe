import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  const password = process.env.SENDASAFE_TEST_PASSWORD
  if (!password) throw new Error('The test server did not configure an administrative password')
  await page.goto('/admin')
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
}

test('anonymous comments are private until approved and stay within their country', async ({ page, context }) => {
  const comment = `Mensaje anónimo de prueba ${randomUUID()}`
  await page.goto('/community')
  await page.getByLabel('¿Desde qué país participas?').selectOption('GT')
  await page.getByRole('button', { name: 'Ver comunidad' }).click()
  await page.getByLabel('Comentario', { exact: true }).fill(comment)
  await page.getByRole('button', { name: 'Enviar de forma anónima' }).click()
  await expect(page.getByText(/Recibimos tu comentario/)).toBeVisible()
  await expect(page.getByText(comment, { exact: true })).toHaveCount(0)

  await page.goto('/admin?country=GT')
  await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible()
  await expect(page.getByText(comment, { exact: true })).toHaveCount(0)
  await signIn(page)
  const session = (await context.cookies()).find(cookie => cookie.path === '/admin')
  expect(session).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/admin' })

  await page.getByLabel('País del panel').selectOption('GT')
  await expect(page).toHaveURL(/country=GT&view=comments/)
  const pending = page.getByRole('listitem').filter({ hasText: comment })
  await pending.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByText('Se actualizó la moderación del comentario.')).toBeVisible()
  await page.goto('/community?country=GT')
  await expect(page.getByRole('listitem').filter({ hasText: comment })).toContainText('Persona anónima')
  await page.goto('/community?country=MX')
  await expect(page.getByText(comment, { exact: true })).toHaveCount(0)

  await page.goto('/admin?country=GT&view=comments&status=published')
  await page.getByRole('listitem').filter({ hasText: comment }).getByRole('button', { name: 'Ocultar' }).click()
  await expect(page.getByText('Se actualizó la moderación del comentario.')).toBeVisible()
  await page.goto('/community?country=GT')
  await expect(page.getByText(comment, { exact: true })).toHaveCount(0)
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible()
  expect((await context.cookies()).filter(cookie => cookie.path === '/admin')).toHaveLength(0)
})

test('an administrator can publish, withdraw, and restore an entity resource', async ({ page, request }) => {
  const entity = `Entidad CI ${randomUUID()}`
  await signIn(page)
  await page.goto('/admin?country=GT&view=entities')
  await page.getByLabel('Nombre de la entidad').fill(entity)
  await page.getByRole('button', { name: 'Guardar entidad' }).click()
  await expect(page.getByText('Se guardó la entidad.')).toBeVisible()
  await page.getByRole('link', { name: 'Recursos', exact: true }).click()
  await page.getByLabel('Entidad registrada').selectOption({ label: entity })
  await page.getByRole('combobox', { name: 'Categoría', exact: true }).selectOption('health-and-psychosocial')
  await page.getByLabel('Descripción del servicio').fill('Recurso ficticio para automatizar pruebas.')
  await page.getByLabel('Número', { exact: true }).fill('+50229998887')
  await page.getByLabel('Fecha de revisión').fill('2026-01-01')
  await page.getByLabel(/Fuentes HTTPS/).fill('https://example.com/')
  await page.getByRole('button', { name: 'Publicar recurso' }).click()
  await expect(page.getByText('Se guardó el recurso y ya está disponible en el directorio.')).toBeVisible()

  async function countPublicResources() {
    const uri = new URLSearchParams({ q: entity })
    const response = await request.get(`/api/v1/countries/GT/resources?${uri}`)
    expect(response.ok()).toBe(true)
    return (await response.json()).resources.length
  }

  await expect.poll(countPublicResources).toBe(1)
  const query = new URLSearchParams({ country: 'GT', view: 'resources', q: entity })
  await page.goto(`/admin?${query}`)
  await page.getByRole('button', { name: `Retirar ${entity}` }).click()
  await expect.poll(countPublicResources).toBe(0)
  await page.goto(`/admin?${query}`)
  await page.getByRole('button', { name: `Restaurar ${entity}` }).click()
  await expect.poll(countPublicResources).toBe(1)
})
