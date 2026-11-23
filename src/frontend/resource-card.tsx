import { categories, type ContactChannel, type Resource } from '../shared/directory'
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

function contactNumber({ number, routing }: ContactChannel) {
  if (routing === 'short-code' || number.length <= 4) return { number }

  const parsed = number.startsWith('+') ? parsePhoneNumberFromString(number) : undefined
  if (parsed) {
    const prefix = `+${parsed.countryCallingCode}`
    return { prefix, number: parsed.formatInternational().slice(prefix.length).trim() }
  }

  const domesticPrefix = number.match(/^(?:018000|0800|1800|800|600)/)?.[0]
  if (domesticPrefix) {
    const subscriber = number.slice(domesticPrefix.length)
    const groups = subscriber.length >= 6 ? [subscriber.slice(0, 3), subscriber.slice(3)] : [subscriber]
    const prefix = domesticPrefix === '018000' ? '01 8000' : domesticPrefix
    return { number: [prefix, ...groups].join(' ') }
  }

  return { number: number.replace(/\B(?=(?:\d{3})+(?!\d))/g, ' ') }
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

const distanceFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })

export function ResourceCard({ resource, distance }: Readonly<{ resource: Resource; distance?: number }>) {
  const { coverage, verification } = resource

  return (
    <article className="resource-card" data-category={resource.category}>
      <div className="resource-meta">
        <span>{categories[resource.category]}</span>
        <span>{coverage.scope === 'national' ? 'Cobertura nacional' : coverage.area}</span>
        {distance !== undefined && (
          <span className="resource-distance">
            {distance < 1 ? 'Menos de 1 km' : `Aprox. ${distanceFormat.format(distance)} km`}
          </span>
        )}
      </div>
      <h3>{resource.organization}</h3>
      <p>{resource.service}</p>
      <dl className="resource-facts">
        <div><dt>Horario</dt><dd>{resource.hours ?? 'Por confirmar'}</dd></div>
        {resource.requirements && <div><dt>Requisitos</dt><dd>{resource.requirements}</dd></div>}
      </dl>
      <div className="resource-actions">
        {resource.channels.map(channel => {
          const label = channel.type === 'whatsapp'
            ? 'WhatsApp'
            : channel.routing === 'switchboard' ? 'Llamar a central' : 'Llamar'
          const number = contactNumber(channel)
          const spokenNumber = [number.prefix, number.number].filter(Boolean).join(' ')
          return (
            <a className="contact-link" key={`${channel.type}:${channel.number}:${channel.extension ?? ''}`}
              href={contactHref(channel)} data-channel={channel.type}
              aria-label={`${label} al ${spokenNumber}${channel.extension ? `, extensión ${channel.extension}` : ''}`}>
              <span className="contact-content">
                <bdi className="contact-number" dir="ltr">
                  {number.prefix && <span className="contact-prefix">{number.prefix}</span>}
                  <span>{number.number}</span>
                </bdi>
                {channel.extension && <span className="contact-extension">Ext. {channel.extension}</span>}
              </span>
              <span className="contact-action">{label}</span>
            </a>
          )
        })}
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
