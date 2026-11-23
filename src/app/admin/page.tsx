import type { Metadata } from 'next'
import Link from 'next/link'
import { adminConfigured, isAdmin } from '../../backend/admin-auth'
import { communityPageSize, moderationComments, type CommentStatus } from '../../backend/community'
import { baseResources } from '../../backend/directory/catalog'
import { listEntities, managedResources } from '../../backend/directory/overrides'
import { ActionForm } from '../../frontend/action-form'
import { CountryFilter } from '../../frontend/country-filter'
import { Pagination } from '../../frontend/pagination'
import { ResourceEditor } from '../../frontend/resource-editor'
import { SectionHeader } from '../../frontend/section-header'
import { categories, countries, type Country } from '../../shared/directory'
import { countryCode, pageNumber } from '../../shared/forms'
import { login, logout, toggleResource, updateComment, updateEntity } from './actions'

export const metadata: Metadata = {
  title: 'Administración | SendaSafe',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

const views = { comments: 'Comentarios', entities: 'Entidades', resources: 'Recursos' }
const statuses = { pending: 'Pendientes', published: 'Publicados', rejected: 'Ocultos' }
const notices: Record<string, string> = {
  moderated: 'Se actualizó la moderación del comentario.',
  entity: 'Se guardó la entidad.',
  resource: 'Se guardó el recurso y ya está disponible en el directorio.',
  archived: 'Se retiró el recurso del directorio público.',
  restored: 'Se restauró el recurso en el directorio público.',
  stale: 'La ficha cambió mientras la revisabas. Consulta el estado actual.',
  'restore-error': 'El recurso no se pudo restaurar porque uno de sus canales ya está en uso.',
}

function adminUrl(country: Country, view: string, more: Record<string, string> = {}) {
  return '/admin?' + new URLSearchParams({ country, view, ...more })
}

async function Moderation({ country, status, page }: { country: Country; status: CommentStatus; page: number }) {
  const comments = await moderationComments(country, status, page)
  return (
    <section className="feature-panel" aria-labelledby="moderation">
      <h2 id="moderation">Moderación de comentarios</h2>
      <p className="feature-muted">Revisa que el texto no incluya datos personales, amenazas ni contenido abusivo antes de publicarlo.</p>
      <nav className="feature-tabs" aria-label="Estado de los comentarios">
        {Object.entries(statuses).map(([value, name]) => (
          <Link key={value} href={adminUrl(country, 'comments', { status: value })} aria-current={status === value ? 'page' : undefined}>{name}</Link>
        ))}
      </nav>
      {comments.length === 0 && <p className="feature-muted">No hay comentarios en esta vista.</p>}
      <ul className="feature-feed">
        {comments.slice(0, communityPageSize).map(comment => (
          <li className="feature-list-item" key={comment.id}>
            <time dateTime={comment.created_at}>{new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(comment.created_at))}</time>
            <p className="comment-body">{comment.body}</p>
            <form action={updateComment} className="feature-actions">
              <input type="hidden" name="id" value={comment.id} />
              <input type="hidden" name="country" value={country} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="page" value={page} />
              {status === 'pending' && <button className="feature-button" name="decision" value="published">Publicar</button>}
              {status !== 'rejected' && <button className="feature-button secondary" name="decision" value="rejected">{status === 'pending' ? 'Rechazar' : 'Ocultar'}</button>}
              {status === 'rejected' && <button className="feature-button secondary" name="decision" value="pending">Devolver a pendientes</button>}
              {status === 'rejected' && <details>
                <summary>Eliminar de forma definitiva</summary>
                <p className="feature-muted">Se borrará el comentario de la base activa.</p>
                <button className="feature-button secondary" name="decision" value="delete">Confirmar eliminación</button>
              </details>}
            </form>
          </li>
        ))}
      </ul>
      <Pagination page={page} hasMore={comments.length > communityPageSize}
        href={number => adminUrl(country, 'comments', { status, page: String(number) })} />
    </section>
  )
}

async function Entities({ country, id }: { country: Country; id?: string }) {
  const entities = await listEntities(country)
  const selected = entities.find(item => String(item.id) === id)
  return (
    <div className="feature-columns">
      <section className="feature-panel" aria-labelledby="entity-form">
        <h2 id="entity-form">{selected ? 'Editar entidad' : 'Agregar entidad'}</h2>
        <p className="feature-muted">Puedes usar una misma entidad para varios recursos del país.</p>
        <ActionForm key={selected?.id ?? 'new'} action={updateEntity} submitLabel="Guardar entidad">
          <input type="hidden" name="country" value={country} />
          {selected && <input type="hidden" name="id" value={selected.id} />}
          <label>Nombre de la entidad<input name="name" defaultValue={selected?.name} minLength={2} maxLength={180} required /></label>
        </ActionForm>
        {selected && <Link href={adminUrl(country, 'entities')}>Agregar otra entidad</Link>}
      </section>
      <section className="feature-panel" aria-labelledby="entities">
        <h2 id="entities">Entidades registradas</h2>
        {entities.length === 0 && <p className="feature-muted">Aún no has registrado entidades en {countries[country]}.</p>}
        <ul className="feature-feed">
          {entities.map(item => <li key={item.id} className="feature-list-item feature-row">
            <strong>{item.name}</strong>
            <Link href={adminUrl(country, 'entities', { entity: String(item.id) })} aria-label={`Editar ${item.name}`}>Editar</Link>
          </li>)}
        </ul>
      </section>
    </div>
  )
}

async function Resources({ country, id, query, page }: { country: Country; id?: string; query: string; page: number }) {
  const [entries, entities] = await Promise.all([managedResources(country, baseResources(country)), listEntities(country)])
  const needle = query.toLocaleLowerCase('es')
  const matching = entries.filter(({ resource }) => [resource.organization, resource.service, categories[resource.category], ...resource.channels.map(channel => channel.number)]
    .some(value => value.toLocaleLowerCase('es').includes(needle)))
    .sort((a, b) => Number(a.archived) - Number(b.archived) || a.resource.organization.localeCompare(b.resource.organization, 'es'))
  const selected = entries.find(item => item.resource.id === id && !item.archived)
  const perPage = 15
  const offset = (page - 1) * perPage

  return (
    <div className="feature-columns resource-admin-columns">
      <section className="feature-panel" id="resource-editor" aria-labelledby="resource-form">
        <div className="feature-row">
          <h2 id="resource-form">{selected ? 'Editar recurso' : 'Agregar recurso'}</h2>
          {selected && <Link href={adminUrl(country, 'resources') + '#resource-editor'}>Crear nuevo</Link>}
        </div>
        <ResourceEditor key={selected?.resource.id ?? country} country={country} entities={entities} entry={selected} />
      </section>
      <section className="feature-panel" aria-labelledby="resource-list">
        <h2 id="resource-list">Recursos del directorio</h2>
        <form method="get" action="/admin" className="feature-form">
          <input type="hidden" name="country" value={country} /><input type="hidden" name="view" value="resources" />
          <label>Buscar por entidad, categoría o número<input name="q" type="search" defaultValue={query} maxLength={100} /></label>
          <button className="feature-button secondary">Buscar recursos</button>
        </form>
        <p className="feature-muted">{matching.length} {matching.length === 1 ? 'recurso' : 'recursos'}</p>
        <ul className="feature-feed">
          {matching.slice(offset, offset + perPage).map(({ resource, archived, bundled }) => (
            <li className="feature-list-item" key={resource.id}>
              <strong>{resource.organization}</strong>
              <p className="feature-muted">{categories[resource.category]} · {archived ? 'Retirado' : 'Publicado'} · {bundled ? 'Catálogo base' : 'Creado en el panel'}</p>
              <div className="feature-actions">
                {!archived && <Link className="feature-button secondary" href={adminUrl(country, 'resources', { resource: resource.id, q: query, page: String(page) }) + '#resource-editor'}
                  aria-label={`Editar ${resource.organization}`}>Editar</Link>}
                <form action={toggleResource}>
                  <input type="hidden" name="country" value={country} /><input type="hidden" name="id" value={resource.id} />
                  <input type="hidden" name="archived" value={String(archived)} />
                  <button className="feature-button secondary" aria-label={`${archived ? 'Restaurar' : 'Retirar'} ${resource.organization}`}>{archived ? 'Restaurar' : 'Retirar'}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <Pagination page={page} hasMore={offset + perPage < matching.length}
          href={number => adminUrl(country, 'resources', { q: query, page: String(number) }) + '#resource-list'} />
      </section>
    </div>
  )
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{
  country?: string; view?: string; status?: string; page?: string; notice?: string; entity?: string; resource?: string; q?: string;
}> }) {
  const signedIn = await isAdmin()
  const params = await searchParams
  const country = countryCode(params.country)
  const view = params.view && Object.hasOwn(views, params.view) ? params.view : 'comments'
  const status = params.status && Object.hasOwn(statuses, params.status) ? params.status as CommentStatus : 'pending'
  const page = pageNumber(params.page)
  const notice = typeof params.notice === 'string' && Object.hasOwn(notices, params.notice) ? notices[params.notice] : undefined

  return (
    <>
      <SectionHeader active="admin" />
      <main className="shell feature-shell" id="main" tabIndex={-1}>
        <div className="feature-intro feature-row">
          <h1>Administración</h1>
          {signedIn && <form action={logout}><button className="feature-button secondary">Cerrar sesión</button></form>}
        </div>
        {!signedIn ? (
          <section className="feature-panel admin-signin" aria-labelledby="access">
            <h2 id="access">Acceso al panel</h2>
            <p className="feature-muted">Ingresa la contraseña de administración para gestionar el directorio y moderar la comunidad.</p>
            {adminConfigured() ? <ActionForm action={login} submitLabel="Iniciar sesión">
              <label>Contraseña<input name="password" type="password" autoComplete="current-password" maxLength={512} required /></label>
            </ActionForm> : <p className="feature-notice">El acceso administrativo todavía no está configurado.</p>}
          </section>
        ) : (
          <>
            <div className="feature-panel">
              <CountryFilter key={country} action="/admin" country={country} view={view} />
              {country && <nav className="feature-tabs" aria-label="Funciones de administración">
                {Object.entries(views).map(([key, label]) => <Link key={key} href={adminUrl(country, key)}
                  aria-current={view === key ? 'page' : undefined}>{label}</Link>)}
              </nav>}
            </div>
            {notice && <p className="feature-notice" role="status">{notice}</p>}
            {country && view === 'comments' && <Moderation country={country} status={status} page={page} />}
            {country && view === 'entities' && <Entities country={country} id={params.entity} />}
            {country && view === 'resources' && <Resources country={country} id={params.resource}
              query={typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''} page={page} />}
          </>
        )}
      </main>
    </>
  )
}
