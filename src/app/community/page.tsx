import type { Metadata } from 'next'
import Link from 'next/link'
import { communityPageSize, publishedComments } from '../../backend/community'
import { storageEnabled } from '../../backend/storage'
import { ActionForm } from '../../frontend/action-form'
import { CountryFilter } from '../../frontend/country-filter'
import { Pagination } from '../../frontend/pagination'
import { SectionHeader } from '../../frontend/section-header'
import { countries } from '../../shared/directory'
import { countryCode, pageNumber } from '../../shared/forms'
import { submitCommunityComment } from './actions'

export const metadata: Metadata = { title: 'Comunidad | SendaSafe' }
export const dynamic = 'force-dynamic'

export default async function CommunityPage({ searchParams }: {
  searchParams: Promise<{ country?: string; page?: string }>;
}) {
  const params = await searchParams
  const country = countryCode(params.country)
  const page = pageNumber(params.page)
  const enabled = storageEnabled()
  const comments = country && enabled ? await publishedComments(country, page) : []

  return (
    <>
      <SectionHeader active="community" />
      <main className="shell feature-shell" id="main" tabIndex={-1}>
        <div className="feature-intro">
          <h1>Comunidad</h1>
          <p>Comparte una experiencia o una sugerencia con la comunidad de tu país. Todos los comentarios se publican como anónimos después de una revisión.</p>
        </div>
        {enabled ? <div className="feature-panel">
          <CountryFilter key={country} action="/community" country={country} />
        </div> : <p className="feature-notice">La comunidad está pendiente de configurar en este sitio.</p>}
        {enabled && country && (
          <div className="feature-columns">
            <section className="feature-panel" aria-labelledby="compose">
              <h2 id="compose">Escribe un comentario</h2>
              <p className="feature-muted">Tu comentario quedará asociado a {countries[country]}. Evita incluir nombres, teléfonos, direcciones u otros datos personales.</p>
              <ActionForm key={country} action={submitCommunityComment} submitLabel="Enviar de forma anónima">
                <input type="hidden" name="country" value={country} />
                <label className="feature-honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <label htmlFor="comment-body">Comentario</label>
                <textarea id="comment-body" name="body" rows={5} minLength={10} maxLength={1000} aria-describedby="comment-limit" required />
                <p id="comment-limit" className="feature-muted">Entre 10 y 1,000 caracteres.</p>
              </ActionForm>
            </section>
            <section aria-labelledby="comments">
              <h2 id="comments">Comentarios de {countries[country]}</h2>
              <ul className="feature-feed">
                {comments.slice(0, communityPageSize).map(comment => (
                  <li className="feature-panel" key={comment.id}>
                    <div className="feature-row">
                      <strong>Persona anónima</strong>
                      <time dateTime={comment.created_at}>{new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(comment.created_at))}</time>
                    </div>
                    <p className="comment-body">{comment.body}</p>
                  </li>
                ))}
              </ul>
              {comments.length === 0 && <p className="feature-panel feature-muted">{page === 1 ? 'Todavía no hay comentarios publicados en este país.' : 'No hay comentarios en esta página.'}</p>}
              <Pagination page={page} hasMore={comments.length > communityPageSize}
                href={number => `/community?country=${country}&page=${number}#comments`} />
            </section>
          </div>
        )}
      </main>
      <footer className="site-footer"><div className="shell feature-row"><Link href="/">SendaSafe</Link><Link href="/admin">Administración</Link></div></footer>
    </>
  )
}
