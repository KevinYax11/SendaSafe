import { categories, type ContactChannel, type Resource } from '../shared/directory'

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

export function ResourceCard({ resource }: Readonly<{ resource: Resource }>) {
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
      </details>
    </article>
  )
}
