import { categories, type ContactChannel, type Country, type Resource } from '../shared/directory'

function contactLabel(channel: ContactChannel) {
  const action = channel.type === 'whatsapp'
    ? 'WhatsApp'
    : channel.routing === 'switchboard' ? 'Llamar a central' : 'Llamar'
  const extension = channel.extension ? ` · ext. ${channel.extension}` : ''
  return `${action} ${channel.number}${extension}`
}

function contactHref(channel: ContactChannel) {
  if (channel.type === 'whatsapp') return `https://wa.me/${channel.number.slice(1)}`
  return `tel:${channel.number}`
}

const dateFormat = new Intl.DateTimeFormat('es', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

function reportHref(country: Country, resource: Resource) {
  const params = new URLSearchParams({
    title: `[Directorio] Corregir ${resource.organization}`,
    body: [
      `Ficha: ${country}/${resource.id}`,
      '',
      '¿Qué dato público del servicio cambió?',
      '',
      'Fuente pública que permite comprobarlo:',
      '',
      'Incluye solo información pública del servicio. Este reporte es público.',
    ].join('\n'),
  })
  return `https://github.com/KevinYax11/SendaSafe/issues/new?${params}`
}

export function ResourceCard({ country, resource }: Readonly<{ country: Country; resource: Resource }>) {
  const { coverage, verification } = resource

  return (
    <article className="resource-card" data-category={resource.category}>
      <div className="resource-meta">
        <span>{categories[resource.category]}</span>
        <span>{coverage.scope === 'national' ? 'Cobertura nacional' : coverage.area}</span>
      </div>
      <h3>{resource.organization}</h3>
      <p>{resource.service}</p>
      <dl className="resource-facts">
        <div><dt>Horario</dt><dd>{resource.hours ?? 'Por confirmar'}</dd></div>
        {resource.requirements && <div><dt>Requisitos</dt><dd>{resource.requirements}</dd></div>}
      </dl>
      <div className="resource-actions">
        {resource.channels.map(channel => (
          <a key={`${channel.type}:${channel.number}:${channel.extension ?? ''}`} href={contactHref(channel)}>
            {contactLabel(channel)}
          </a>
        ))}
      </div>
      <details className="resource-details">
        <summary>Detalles y fuentes</summary>
        <dl>
          <div><dt>Costo</dt><dd>{resource.cost ?? 'Por confirmar'}</dd></div>
          {!resource.requirements && <div><dt>Requisitos</dt><dd>Por confirmar</dd></div>}
          <div>
            <dt>{verification.method === 'phone-confirmed' ? 'Confirmado por llamada' : 'Revisión de fuentes'}</dt>
            <dd><time dateTime={verification.reviewedOn}>{dateFormat.format(new Date(verification.reviewedOn))}</time></dd>
          </div>
        </dl>
        <ul>
          {verification.sources.map(source => (
            <li key={source}><a href={source}>{new URL(source).hostname.replace(/^www\./, '')}</a></li>
          ))}
        </ul>
        <div className="resource-report">
          <a href={reportHref(country, resource)} aria-label={`Reportar un dato de ${resource.organization} en GitHub`}>
            Reportar un dato en GitHub
          </a>
          <p>El reporte es público. Incluye solo datos del servicio.</p>
        </div>
      </details>
    </article>
  )
}
