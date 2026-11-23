# SendaSafe

[![CI](https://github.com/KevinYax11/SendaSafe/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/KevinYax11/SendaSafe/actions/workflows/ci.yml)

Directorio de ayuda para Latinoamérica y el Caribe. Permite buscar servicios de emergencia, salud, albergue, migración y protección por país o municipio, consultar contactos cercanos y guardar un directorio para usarlo sin conexión.

## Prueba la demo

Con Docker y Docker Compose instalados, ejecuta estos comandos desde la raíz del repositorio.

```sh
node scripts/setup-local.mjs --compose
docker compose up --build
```

El primer comando requiere Node.js 22 y genera una contraseña de administración y un secreto de sesión en el archivo local `.env`. Para explorar solo el directorio y la comunidad, basta con ejecutar `docker compose up --build`. Abre [SendaSafe en localhost](http://localhost:3000).

1. Selecciona **Guatemala** y escribe **Salamá**. El buscador muestra recursos de municipios cercanos y opciones de cobertura más amplia, incluso si la ciudad aún no tiene una ficha propia.
2. Abre **Mapa** y elige Guatemala. Pulsa un marcador para ver sus fichas. Usa **Mostrar recursos** para consultar también los servicios nacionales o regionales sin un punto en el mapa.
3. Regresa al directorio y pulsa **Descargar para usar sin conexión**. Espera la fecha de guardado y vuelve a abrir la página sin internet. Puedes buscar en la copia y consultar teléfonos.
4. En **Comunidad**, envía un comentario ficticio para Guatemala. Abre **Administración** desde el pie de página, ingresa la contraseña generada en `.env`, elige Guatemala y publica el comentario. Vuelve a Comunidad para comprobar que aparece en el país elegido. Usa este mismo panel para crear entidades y editar, retirar o restaurar fichas.

## Funcionalidades

| Vista | Qué permite hacer |
| --- | --- |
| Directorio | Cambiar de país, filtrar por categoría, buscar por municipio o institución y abrir los canales de teléfono o WhatsApp. Cada ficha incluye alcance, condiciones de atención y fuentes. |
| Mapa | Explorar la cobertura por país, abrir fichas agrupadas por municipio y ordenar los resultados por cercanía. El permiso de ubicación se solicita al pulsar **Usar mi ubicación**. |
| Orientación | Preparar una llamada o visita, consultar las opciones de emergencia del país y aprender a guardar el directorio. |
| Comunidad | Enviar comentarios sin cuenta. Los comentarios se publican después de la revisión y se muestran por país. |
| Administración | Moderar comentarios, gestionar entidades y mantener el directorio mediante cambios sobre los catálogos base. |

### Instalación y uso sin conexión

**Instalar en tu dispositivo** muestra instrucciones para Chrome en Android y computadora, y Safari en iPhone y iPad. La PWA funciona en la compilación de producción con HTTPS o en localhost. Para probar la instalación en otro equipo necesitas una URL HTTPS que ese equipo pueda abrir.

Guarda cada país por separado. La app conserva sus fichas y el índice de municipios cuando está disponible. Las copias muestran su fecha y se actualizan al recuperar la conexión. El modo offline cubre el directorio descargado y Orientación. El mapa interactivo, Comunidad, Administración y WhatsApp requieren conexión. **Llamar** entrega el número a la aplicación de teléfono. Completar la llamada requiere servicio telefónico.

## Cobertura y fuentes

El catálogo base incluye **964 fichas y 1.071 canales de contacto** en 21 países y territorios. Cada catálogo tiene al menos 45 fichas y cinco números distintos por categoría. El validador también comprueba los mínimos ampliados de los catálogos originales.

| País o territorio | Fichas | Catálogo |
| --- | ---: | --- |
| Argentina | 45 | [AR](data/countries/ar/resources.json) |
| Bolivia | 45 | [BO](data/countries/bo/resources.json) |
| Brasil | 45 | [BR](data/countries/br/resources.json) |
| Chile | 45 | [CL](data/countries/cl/resources.json) |
| Colombia | 47 | [CO](data/countries/co/resources.json) |
| Costa Rica | 46 | [CR](data/countries/cr/resources.json) |
| Cuba | 45 | [CU](data/countries/cu/resources.json) |
| Ecuador | 45 | [EC](data/countries/ec/resources.json) |
| El Salvador | 48 | [SV](data/countries/sv/resources.json) |
| Guatemala | 49 | [GT](data/countries/gt/resources.json) |
| Haití | 45 | [HT](data/countries/ht/resources.json) |
| Honduras | 47 | [HN](data/countries/hn/resources.json) |
| México | 49 | [MX](data/countries/mx/resources.json) |
| Nicaragua | 45 | [NI](data/countries/ni/resources.json) |
| Panamá | 48 | [PA](data/countries/pa/resources.json) |
| Paraguay | 45 | [PY](data/countries/py/resources.json) |
| Perú | 45 | [PE](data/countries/pe/resources.json) |
| Puerto Rico | 45 | [PR](data/countries/pr/resources.json) |
| República Dominicana | 45 | [DO](data/countries/do/resources.json) |
| Uruguay | 45 | [UY](data/countries/uy/resources.json) |
| Venezuela | 45 | [VE](data/countries/ve/resources.json) |

Los catálogos enlazan las fuentes por ficha en `verification.sources`. Se revisaron registros públicos de servicios de emergencia, ministerios y organizaciones de asistencia. Los enlaces y la fecha también aparecen en **Detalles y fuentes**. La revisión inicial fue documental. Registra `phone-confirmed` únicamente cuando el prestador confirme los datos por teléfono. Prioriza emergencias y albergues al corregir fichas. Retira contactos que pierdan su fuente verificable. [CONRED](https://conred.gob.gt/sinaprese2026/) · [ACNUR](https://help.unhcr.org/guatemala/) · [ECU 911](https://www.ecu911.gob.ec/como-reportar-al-9-1-1/)

Los límites de país se derivan de los datos de dominio público de Natural Earth. El índice de lugares usa GeoNames bajo CC BY 4.0. Lomas de Solymar usa un punto público de OpenStreetMap. Para regenerar los archivos, reúne el GeoJSON de Natural Earth 5.1.2 como `world.geojson`, `admin1CodesASCII.txt` y los 21 ZIP de GeoNames, y ejecuta `python scripts/build-geography.py <carpeta>`. [Natural Earth](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson) · [GeoNames](https://download.geonames.org/export/dump/) · [OpenStreetMap](https://www.openstreetmap.org/node/1987912394)

## Arquitectura

| Capa | Tecnologías y responsabilidad |
| --- | --- |
| Interfaz | Next.js App Router, React, TypeScript y CSS. El navegador aplica filtros, calcula cercanía y usa un service worker y Cache Storage para la PWA. |
| Aplicación | Rutas HTTP públicas, acciones de servidor para Comunidad y Administración, y validación del catálogo y de los formularios. |
| Datos | JSON versionado por país. SQLite guarda comentarios, entidades, sesiones y cambios del directorio en local o Docker. La integración con Turso es opcional al preparar una instancia de Vercel. |
| Infraestructura | Docker Compose con volumen persistente, compilación standalone y comprobación de salud HTTP. GitHub Actions ejecuta las pruebas en `develop` y `main`. |

La ubicación se procesa en el navegador. El mapa usa centros aproximados de municipios o distritos y distancias en línea recta. Los catálogos mantienen los teléfonos como cadenas para conservar los ceros iniciales de los códigos cortos. Los cambios administrativos se aplican sobre el catálogo base al construir las respuestas públicas.

La comunidad guarda texto, país, fecha y estado de moderación. No solicita cuenta ni nombre. La infraestructura de alojamiento puede mantener registros de acceso. Administración usa una contraseña propia y un secreto independiente. Las sesiones vencen a las ocho horas y la cookie se limita a `/admin`, con `HttpOnly`, `SameSite=Strict` y `Secure` en HTTPS.

### API pública

| Endpoint | Respuesta |
| --- | --- |
| `GET /api/v1/countries` | Países y territorios del selector, con indicadores de cobertura. |
| `GET /api/v1/countries/{country}/resources` | Metadatos y fichas del país. Acepta filtros opcionales `q` y `category`. |

```sh
curl "http://localhost:3000/api/v1/countries/GT/resources?q=coban&category=migration-and-legal"
```

Las búsquedas admiten hasta 100 caracteres. La API devuelve `400` para filtros inválidos o repetidos y `404` si el país no está soportado.

### Estructura

| Ruta | Contenido |
| --- | --- |
| [src/app](src/app) | Páginas, rutas públicas y acciones de servidor. |
| [src/frontend](src/frontend) | Directorio, mapa, formularios y almacenamiento offline. |
| [src/backend](src/backend) | Catálogos, persistencia, moderación y sesiones. |
| [src/shared](src/shared) | Tipos, reglas de contacto y filtros compartidos. |
| [data/countries](data/countries) | Catálogos y fuentes por país. |
| [public/geography](public/geography) | Límites e índices geográficos que carga el navegador. |
| [scripts](scripts) y [tests](tests) | Validadores, pruebas HTTP y recorridos de navegador. |

## Desarrollo sin Docker

Necesitas Node.js 22. La versión de producción activa la PWA y permite probar el modo offline en localhost.

```sh
npm ci
node scripts/setup-local.mjs
npm run build
npm start
```

Abre [SendaSafe en localhost](http://localhost:3000). Para editar con recarga automática usa `npm run dev`. La contraseña se genera en `.env.local` para Node.js y en `.env` para Docker Compose. Ambos archivos están excluidos de Git. Usa `node scripts/setup-local.mjs --rotate` si necesitas rotar los secretos locales.

| Variable | Uso |
| --- | --- |
| `SENDASAFE_ADMIN_PASSWORD` | Contraseña de Administración, con un mínimo de 16 caracteres. |
| `SENDASAFE_SESSION_SECRET` | Secreto independiente para sesiones, con un mínimo de 32 caracteres. |
| `SENDASAFE_DB_PATH` | Ruta opcional de SQLite. Por defecto usa `storage/sendasafe.sqlite`. |
| `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` | Conexión opcional a almacenamiento persistente para Vercel. |

Compose conserva la base en el volumen `sendasafe-storage`. Para respaldar una instalación local, detén la aplicación y guarda el archivo SQLite junto con sus archivos WAL y SHM si existen. Conserva el volumen si reemplazas el contenedor.

## Pruebas y CI

| Trabajo | Verificaciones |
| --- | --- |
| `verify` | Formato y cobertura de los 21 catálogos, lint, TypeScript y compilación de producción. |
| `container` | Construcción y arranque de Docker, API, manifest, iconos y datos geográficos. Comprueba que SQLite sobrevive al reemplazo del contenedor y que el modo Vercel de solo lectura responde sin base remota. |
| `browser` | Playwright en Chromium verifica búsqueda móvil, enlaces de llamada, mapa con ubicación simulada, reapertura offline, moderación por país y ciclo de publicación, retiro y restauración de recursos. |

```sh
npm run validate:directory
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright arranca la compilación en el puerto 3100 con una base de pruebas aislada y credenciales temporales. Si falla una prueba en CI, el informe conserva la traza para revisarla. Con una instancia en marcha, usa `node scripts/check-deployment.mjs <url>` para probar la API y los recursos públicos. Añade `--read-only` para comprobar una instancia de Vercel sin base de datos. [Ejecuciones de CI](https://github.com/KevinYax11/SendaSafe/actions)

## Despliegue opcional

**Vercel.** Importa el repositorio con el preset Next.js y elige `main` para producción. El directorio, Mapa, Orientación y la PWA pueden funcionar en modo de solo lectura sin variables adicionales. Para habilitar Comunidad y Administración, configura una base Turso y los secretos del panel. Usa bases y secretos separados para Preview y Production. [Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) · [Turso en Vercel](https://vercel.com/marketplace/tursocloud/database)

**Render.** El `Dockerfile` permite preparar un Web Service en Render. El repositorio incluye el contenedor y la configuración de Vercel. Para conservar SQLite en Render, el servicio necesita almacenamiento persistente y `SENDASAFE_DB_PATH` debe apuntar al directorio montado. [Servicios Docker en Render](https://render.com/docs/docker) · [Discos persistentes](https://render.com/docs/disks)
