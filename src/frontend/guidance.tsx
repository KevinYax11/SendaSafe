import type { DirectoryCountry } from '../shared/directory'

export function Guidance({ country, showEmergencies }: {
  country?: DirectoryCountry
  showEmergencies: () => void
}) {
  const hasEmergency = country?.hasEmergencyResources
  const downloadLink = country?.hasCoverage && process.env.NODE_ENV === 'production'
    ? '#guardar-directorio' : '#country'

  return (
    <section id="orientacion" className="shell guidance" aria-labelledby="guidance-title" tabIndex={-1}>
      <h2 id="guidance-title">Orientación general</h2>
      <p className="guidance-intro">Encuentra a quién llamar, qué preguntar antes de ir y cómo tener los contactos a mano si pierdes la conexión.</p>

      <article className="guidance-urgent">
        <div>
          <h3>Si necesitas ayuda inmediata</h3>
          <p>Llama al servicio de emergencia del país donde estás. Indica qué ocurrió, dónde estás y cómo pueden devolverte la llamada. Si no sabes la dirección, da el municipio y una referencia cercana.</p>
        </div>
        <a className="emergency-link" href={hasEmergency ? '#resultados' : '#country'}
          onClick={hasEmergency ? showEmergencies : undefined}>
          {hasEmergency ? `Ver emergencias en ${country.name}` : 'Elegir país para ver emergencias'}
        </a>
      </article>

      <div className="guidance-grid">
        <article>
          <h3>Encuentra el servicio adecuado</h3>
          <p>Elige el país donde estás. Busca tu municipio y filtra por tipo de ayuda, como salud, albergue, migración o protección.</p>
          <p>Si tu municipio no tiene una ficha, revisa las opciones cercanas y la cobertura regional o nacional. Confirma que el servicio atiende tu zona.</p>
          <a className="guidance-link" href={country?.hasCoverage ? '#search' : '#country'}>Buscar ayuda en el directorio</a>
        </article>
        <article>
          <h3>Prepara la llamada</h3>
          <p>Ten a mano tu municipio y una frase que explique qué necesitas. Si la ficha indica una extensión, márcala cuando te atienda la central.</p>
          <p>Si no logras comunicarte, busca otra opción que atienda tu zona y que esté disponible en ese horario.</p>
        </article>
        <article>
          <h3>Antes de ir a un centro</h3>
          <ul>
            <li>Confirma la dirección de la sede, el horario y si necesitas cita.</li>
            <li>Pregunta qué documentos te pedirán y si hay algún costo.</li>
            <li>Si buscas un albergue, consulta si hay cupo y cuándo reciben a las personas.</li>
          </ul>
        </article>
        <article>
          <h3>Si necesitas apoyo migratorio o de protección</h3>
          <p>Busca una entidad de orientación y pregunta cómo solicitar atención, qué cubre el servicio y qué información te pedirán.</p>
          <p>Revisa la fuente y fecha de la ficha. Confirma el canal con la institución antes de enviar documentos y evita publicar datos personales en Comunidad.</p>
        </article>
        <article>
          <h3>Guarda el directorio sin conexión</h3>
          <ol>
            <li>Con internet, elige el país que quieres guardar.</li>
            <li>Pulsa <strong>Descargar para usar sin conexión</strong> y espera la fecha de guardado.</li>
            <li>Vuelve a abrir SendaSafe para consultar la copia. Si instalaste la app, guarda el directorio desde la app instalada.</li>
          </ol>
          <p>Para llamar necesitas cobertura telefónica. WhatsApp requiere internet.</p>
          <a className="guidance-link" href={downloadLink}>Ir a la descarga del directorio</a>
        </article>
      </div>
    </section>
  )
}
