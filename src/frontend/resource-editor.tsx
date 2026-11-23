'use client'

import { useState } from 'react'
import { updateResource } from '../app/admin/actions'
import type { Entity, ManagedResource } from '../backend/directory/overrides'
import { categories, type ContactChannel, type Country } from '../shared/directory'
import { ActionForm } from './action-form'

const emptyChannel: ContactChannel = { type: 'phone', routing: 'direct', number: '' }

export function ResourceEditor({ country, entities, entry }: {
  country: Country; entities: Entity[]; entry?: ManagedResource;
}) {
  const resource = entry?.resource
  const [entity, setEntity] = useState(String(entry?.entityId ?? ''))
  const [scope, setScope] = useState(resource?.coverage.scope ?? 'national')
  const [channels, setChannels] = useState(() => (resource?.channels ?? [emptyChannel]).map((channel, index) => ({ key: index, channel })))
  const [nextKey, setNextKey] = useState(channels.length)

  function addChannel() {
    setChannels(previous => [...previous, { key: nextKey, channel: emptyChannel }])
    setNextKey(previous => previous + 1)
  }

  return (
    <ActionForm action={updateResource} submitLabel={entry ? 'Guardar cambios' : 'Publicar recurso'}>
      <input type="hidden" name="country" value={country} />
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <fieldset>
        <legend>Servicio y cobertura</legend>
        <div className="feature-form-grid">
          <label>Entidad registrada
            <select name="entity" value={entity} onChange={event => setEntity(event.target.value)}>
              <option value="">Escribir nombre manualmente</option>
              {entities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label hidden={!!entity}>Nombre de la entidad
            <input name="organization" defaultValue={resource?.organization} maxLength={180} required={!entity} disabled={!!entity} />
          </label>
          <label>Categoría
            <select name="category" defaultValue={resource?.category ?? ''} required>
              <option value="" disabled>Selecciona una categoría</option>
              {Object.entries(categories).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <label>Alcance
            <select name="scope" value={scope} onChange={event => setScope(event.target.value as typeof scope)}>
              <option value="national">Nacional</option>
              <option value="regional">Regional</option>
              <option value="local">Local</option>
            </select>
          </label>
          <label hidden={scope === 'national'}>Zona de atención
            <input name="area" defaultValue={resource?.coverage.scope !== 'national' ? resource?.coverage.area : ''} required={scope !== 'national'} maxLength={180} />
          </label>
          <label hidden={scope === 'national'}>Municipio {scope === 'regional' ? '(opcional)' : ''}
            <input name="municipality" defaultValue={resource?.coverage.municipality ?? ''} required={scope === 'local'} maxLength={120} />
          </label>
          <label className="feature-full">Descripción del servicio
            <textarea name="service" rows={3} maxLength={1000} defaultValue={resource?.service} required />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Canales de contacto</legend>
        <p className="feature-muted">Usa el prefijo internacional para teléfonos completos. Selecciona «Código corto» para líneas como 911.</p>
        {channels.map(({ key, channel }, index) => (
          <div className="feature-channel" key={key}>
            <div className="feature-row">
              <strong>Canal {index + 1}</strong>
              {channels.length > 1 && <button type="button" className="feature-button secondary"
                onClick={() => setChannels(previous => previous.filter(item => item.key !== key))}>Quitar canal {index + 1}</button>}
            </div>
            <div className="feature-form-grid">
              <label>Tipo de canal
                <select name="channelType" defaultValue={channel.type}>
                  <option value="phone">Teléfono</option><option value="whatsapp">WhatsApp</option>
                </select>
              </label>
              <label>Número<input name="number" type="tel" defaultValue={channel.number} maxLength={32} required /></label>
              <label>Enrutamiento
                <select name="routing" defaultValue={channel.routing}>
                  <option value="direct">Directo</option><option value="short-code">Código corto</option><option value="switchboard">Conmutador</option>
                </select>
              </label>
              <label>Extensión (opcional)<input name="extension" inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} defaultValue={channel.extension} /></label>
            </div>
          </div>
        ))}
        <button type="button" className="feature-button secondary" disabled={channels.length >= 8} onClick={addChannel}>Agregar canal</button>
      </fieldset>
      <fieldset>
        <legend>Condiciones y verificación</legend>
        <div className="feature-form-grid">
          <label>Horario<input name="hours" defaultValue={resource?.hours ?? ''} maxLength={180} /></label>
          <label>Costo<input name="cost" defaultValue={resource?.cost ?? ''} maxLength={180} /></label>
          <label className="feature-full">Requisitos<textarea name="requirements" rows={2} defaultValue={resource?.requirements ?? ''} maxLength={500} /></label>
          <label>Método de verificación
            <select name="method" defaultValue={resource?.verification.method ?? 'institutional-source'}>
              <option value="institutional-source">Fuente institucional</option><option value="phone-confirmed">Confirmación telefónica</option>
            </select>
          </label>
          <label>Fecha de revisión<input name="reviewedOn" type="date" defaultValue={resource?.verification.reviewedOn} required /></label>
          <label className="feature-full">Fuentes HTTPS, una por línea
            <textarea name="sources" rows={3} defaultValue={resource?.verification.sources.join('\n')} required />
          </label>
        </div>
      </fieldset>
    </ActionForm>
  )
}
