# SendaSafe

A Spanish-language, mobile-first directory of emergency services, health resources, and migrant support in Latin America. Visitors can choose the country they are in, search by municipality or service, and open public phone or WhatsApp contacts from each resource card.

## Coverage

| Country | Resources | Catalog |
| --- | ---: | --- |
| Argentina | 45 | [AR](data/countries/ar/resources.json) |
| Chile | 45 | [CL](data/countries/cl/resources.json) |
| Colombia | 47 | [CO](data/countries/co/resources.json) |
| Costa Rica | 46 | [CR](data/countries/cr/resources.json) |
| El Salvador | 48 | [SV](data/countries/sv/resources.json) |
| Guatemala | 49 | [GT](data/countries/gt/resources.json) |
| Honduras | 47 | [HN](data/countries/hn/resources.json) |
| Mexico | 49 | [MX](data/countries/mx/resources.json) |
| Panama | 48 | [PA](data/countries/pa/resources.json) |
| Peru | 45 | [PE](data/countries/pe/resources.json) |
| Uruguay | 45 | [UY](data/countries/uy/resources.json) |
| Ecuador | 45 | [EC](data/countries/ec/resources.json) |
| Brazil | 45 | [BR](data/countries/br/resources.json) |
| Dominican Republic | 45 | [DO](data/countries/do/resources.json) |
| Puerto Rico | 45 | [PR](data/countries/pr/resources.json) |
| Paraguay | 45 | [PY](data/countries/py/resources.json) |
| Bolivia | 45 | [BO](data/countries/bo/resources.json) |
| Nicaragua | 45 | [NI](data/countries/ni/resources.json) |
| Venezuela | 45 | [VE](data/countries/ve/resources.json) |
| Cuba | 45 | [CU](data/countries/cu/resources.json) |
| Haiti | 45 | [HT](data/countries/ht/resources.json) |

The directory covers all 21 options in the country selector.

Each published catalog has at least 45 resources and five distinct numbers in each category. The validator also enforces the expanded per-category totals in the original catalogs.

## Run locally

Requires Node.js 22 or later. A clone of the repository runs the full app locally.

```sh
npm ci
node scripts/setup-local.mjs
npm run build
npm start
```

Open [SendaSafe locally](http://localhost:3000). Use `npm run dev` for live code changes. Installation and the service worker are enabled in the production build.

### Install and save the directory

On Android, use the in-app install button or the browser menu. On iOS, open the site in Safari and use Share → Add to Home Screen. On supported desktop browsers, use the install option in the address bar. Installation requires HTTPS or localhost.

Choose a country while online and use **Descargar para usar sin conexión**. After saving, you can reopen SendaSafe, search that country's saved resources, and look up phone numbers while offline. Download each needed country separately. The app shows when the local copy was saved and refreshes it when the connection returns. Calls require phone service and WhatsApp requires an internet connection. Community, administration, and map lookup require a connection to the app server.

### Community and administration

Community requires a country for each comment and uses that country to filter published messages. Comments do not require an account. The app stores the text, country, timestamp and moderation state. Comments are public only after approval. Avoid posting names, phone numbers or other identifying details. Infrastructure may maintain its own access logs.

Open `/admin` from the footer. The country switch takes effect as soon as you select a country. Administrators can review, publish, hide or delete comments, create entities, and publish, edit, withdraw or restore resources. Resource changes require a contact channel, verification date and HTTPS source.

The setup script writes a random admin password and a separate session secret to the ignored `.env.local` file. Read your password there. Administrative sessions expire after eight hours. The cookie is HTTP-only, uses SameSite Strict and is restricted to `/admin`. HTTPS is required for administrative login outside localhost. Keep both values private and use `node scripts/setup-local.mjs --rotate` to generate new values.

SQLite stores comments and administrative changes in `storage/sendasafe.sqlite` by default. To use another location, set `SENDASAFE_DB_PATH`. Keep backups of the database before moving or upgrading it. Stop the single local app instance and back up the database together with any matching WAL and SHM files. Restore them together to the configured path before restarting.

### Run with Docker

With Docker and Docker Compose running, start the frontend and API together.

```sh
node scripts/setup-local.mjs --compose
docker compose up --build
```

Open [SendaSafe locally](http://localhost:3000). The first command writes the admin credentials to the ignored Compose `.env` file. The image runs the Next.js standalone server as a non-root user. The named volume `sendasafe-storage` keeps changes across restarts and container replacements. Preserve the volume when removing containers.

### Optional map data

To enable the map, provide `municipalities.json` and `boundaries.json` in `data/geography` before building. A Node server can use another folder via `SENDASAFE_GEOGRAPHY_PATH`. For Docker, bundle the files before building or mount the folder read-only and pass its container path in that variable.

`municipalities.json` maps country codes to lists of objects containing `municipality`, `area`, `latitude` and `longitude`. Use the catalog's local coverage area for `area`. `boundaries.json` is a list of objects containing `code` and polygon `rings` made of coordinate pairs in longitude, latitude order. The browser requests location only when the user asks to use it. The map ranks listed resources using approximate distance to their municipality. Without the files, the standard municipality search is available.


## Architecture

The Next.js app contains a React frontend in `src/frontend`, a server-side directory in `src/backend`, and shared types in `src/shared`. The backend reads the country catalog and applies filters. Both layers run in the same deployment.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/v1/countries` | Lists supported country codes and their directory coverage. |
| `GET /api/v1/countries/{country}/resources` | Returns country metadata and resources. Optional `q` and `category` parameters filter results. |

Try `/api/v1/countries/GT/resources?q=coban&category=migration-and-legal`. A country in the selector with no coverage returns an empty resource list. An unknown country returns `404`, and invalid filters return `400`.

## Directory sources

Each resource card shows the sources, date and verification method. Initial reviews use public institutional records. The catalog stores contact details as strings to preserve domestic short codes, including leading zeroes.

- Argentina. [National emergency services](https://www.argentina.gob.ar/node/9642), [ACNUR Argentina](https://help.unhcr.org/argentina/donde-y-como-solicitar-orientacion-y-ayuda-en-argentina/acnurysocios/) and [Bancos de Alimentos Argentina](https://redbda.org.ar/que-hacemos/).
- Chile. [ACNUR Chile](https://help.unhcr.org/chile/ayuda-y-orientacion/), [Corporación de Asistencia Judicial de Tarapacá y Antofagasta](https://www.cajta.cl/index.php/nuestras-oficinas) and [Chilean emergency services](https://www.consulado.gob.cl/emergencias-en-chile).
- Colombia. [ACNUR Colombia](https://help.unhcr.org/colombia/bienvenido-a/donde-encontrar-ayuda/asistencia-legal/) and [Migración Colombia](https://www.migracioncolombia.gov.co/acerca-de-migracion-colombia/directorios/puntos-de-atencion).
- Costa Rica. [Ministry of Labor](https://www.mtss.go.cr/dml/servicios/) and [ACNUR Costa Rica](https://help.unhcr.org/costarica/serviciosacnur).
- El Salvador. [ACNUR El Salvador](https://help.unhcr.org/elsalvador/donde-encontrar-ayuda/numeros-de-telefonos-de-emergencia/) and [Scalabrini International Migration Network](https://www.simn-global.org/centros-scalabrinianos/centro/casa-del-migrante-scalabrini-el-salvador/).
- [Guatemala catalog](data/countries/gt/resources.json). Sources include [CONRED](https://conred.gob.gt/sinaprese2026/), [ACNUR Guatemala](https://help.unhcr.org/guatemala/) and [Scalabrini migrant shelters](https://scalabriniguate.org/contacto/).
- Honduras. [ACNUR Honduras](https://help.unhcr.org/honduras/wp-content/uploads/sites/56/2025/02/Ruta-de-Atencion-Danli.pdf) and the [National Migration Institute](https://inm.gob.hn/contacto).
- [Mexico catalog](data/countries/mx/resources.json). Sources include [ACNUR México](https://help.unhcr.org/mexico/donde-encontrar-ayuda/albergues/), the [Secretaría de Seguridad y Protección Ciudadana](https://www.gob.mx/sspc/es/articulos/sabes-cual-es-la-diferencia-entre-los-numeros-088-089-y-911?idiom=es) and [IMSS](https://www.imss.gob.mx/prensa/archivo/202611/585).
- Panama. [ACNUR Panamá](https://help.unhcr.org/panama/donde-encontrar-ayuda/) and the [National Migration Service](https://www.migracion.gob.pa/contacto/).
- Peru. [Presidency of the Council of Ministers](https://www.gob.pe/547-telefonos-de-emergencia), [Ministry of Health](https://www.gob.pe/saludmental) and [ACNUR Perú](https://help.unhcr.org/peru/donde-encontrar-ayuda/).
- Uruguay. [MIDES](https://www.gub.uy/ministerio-desarrollo-social/personas-en-calle), [ASSE](https://www.asse.com.uy/contenido/RAP-SALTO-5236), [Ministerio del Interior](https://www.gub.uy/ministerio-interior/tramites-y-servicios/servicios/oficinas-direccion-nacional-migracion).
- Ecuador. [ECU 911](https://www.ecu911.gob.ec/como-reportar-al-9-1-1/), [IESS](https://www.iess.gob.ec/es/mapa-de-unidades-medicas), [Defensoría Pública](https://www.defensoria.gob.ec/?page_id=22777), [ACNUR Ecuador](https://help.unhcr.org/ecuador/en/violencia-de-genero-explotacion-y-abuso-sexual/organizaciones-locales-que-atienden-casos-de-violencia-basada-en-genero/).
- Brazil. [Ministério das Comunicações](https://www.gov.br/mcom/pt-br/noticias/2026/setembro/emergencia-voce-sabe-para-quem-ligar-quando-precisa-de-ajuda/), [ACNUR Brasil](https://help.unhcr.org/brazil/onde-encontrar-ajuda/organizacoes-parceiras-da-sociedade-civil/), [Prefeitura de Curitiba](https://servicos-fas.curitiba.pr.gov.br/conteudo.aspx?idf=211).
- Dominican Republic. [Civil Defense emergency directory](https://www.sismap.gob.do/GestionPublica/uploads/evidencias/638581015687823389-Manual-de-Evacuacin-Defensa-Civil-Vigente-2024.pdf), [Roadside assistance](https://mopc.gob.do/servicios/programa-de-protecci%C3%B3n-y-asistencia-vial), [Regional Health Services](https://sns.gob.do/regionales-de-salud/), [Public dining halls](https://comedoreseconomicos.gob.do/dependencias/), [UNHCR partner assistance](https://help.unhcr.org/dominicanrepublic/donde-encontrar-ayuda/solicitantes-asilo-refugio-refugiadas/), [Protection services](https://observatoriojusticiaygenero.poderjudicial.gob.do/wp-content/uploads/2025/06/directorio_profamilia.pdf).
- Puerto Rico. [Department of Public Safety emergency numbers](https://www.dsp.pr.gov/lineas-de-emergencia), [Department of Health hospital listings](https://www.salud.pr.gov/CMS/DOWNLOAD/9687), [ASSMCA treatment centers](https://assmca.pr.gov/tratamientos), [Housing and homeless services](https://coc502pr.com/directorio), [Legal aid centers](https://www.servicioslegales.org/donde-estamos/), [Justice Department victim support](https://www.justicia.pr.gov/secretarias-y-oficinas/servicios-a-las-victimas-y-testigos-de-delitos/).
- Paraguay. [Government emergency lines](https://paraguay.gov.py/), [Ministry of Health services](https://www.mspbs.gov.py/portal/35850/operativo-jahoi-2026-unas-32-personas-atendidas-en-albergues-transitorios.html), [Permanent homes for older adults](https://www.mspbs.gov.py/bienestarsocial/hogares-acuerdos.html), [Public defense offices](https://www.mdp.gov.py/wp-content/uploads/2023/02/Direcciones-y-Telefonos-Nivel-Pais-.pdf), [Women’s regional centers](https://mujer.gov.py/centro-regionales/), [Fono Ayuda](https://minna.gov.py/fonoayuda/).
- Bolivia. [EMAPA emergency directory](https://emapa.gob.bo/wp-content/uploads/2022/10/PREVENCION-ANTE-RESPUESTAS-EMAPA.pdf), [National toxicology directory](https://www.minsalud.gob.bo/component/jdownloads/send/58-programa-nacional-de-gestion-en-salud-ambiental/886-guia-tecnica-para-la-prevencion-diagnostico-tratamiento-y-vigilancia-de-la-intoxicacion-por-mercurio-en-bolivia?Itemid=2394), [La Paz municipal hospitals](https://lapaz.bo/autoridades/), [Consular support directory](https://www.cancilleria.gob.ec/wp-content/uploads/2025/05/Catalogo-ServiciosV6.pdf), [Ombudsperson offices](https://www.defensoria.gob.bo/contenido/preguntas-frecuentes), [UNHCR assistance](https://help.unhcr.org/bolivia/dondeencontrarayuda/), [Child protection offices](https://www.gob.bo/tramites/defensoria-de-la-ninez-y-adolescencia).
- Nicaragua. [Nicaraguan Tourism Institute emergency directory](https://www.mapanicaragua.com/numeros-de-emergencias-otros/), [Medical facilities](https://www.gov.uk/government/publications/hospitals-in-nicaragua/nicaragua-list-of-medical-facilities), [AA service and treatment directory](https://aaosgnicaragua.org/directorio-nacional/), [Food Bank](https://bancoalimentosnicaragua.org.ni/), [Rights and regional offices](https://www.pddh.gob.ni/?p=2420), [Consular support directory](https://www.consulado.gob.cl/consulado-contigo/redes-de-apoyo-en-managua).
- Venezuela. [National Emergency Radio Network](https://www.radioclubve.org/terremoto/), [Red Cross health centers](https://cruzroja.ve/nuestra-presencia/), [Cáritas service map](https://caritasvenezuela.org/mapeo-de-servicios/), [UNHCR offices](https://help.unhcr.org/venezuela/donde-encontrar-ayuda-2/organismos-internacionales/), [Public refugee and rights institutions](https://help.unhcr.org/venezuela/donde-encontrar-ayuda-2/instituciones-publicas/), [UNFPA protection services](https://venezuela.unfpa.org/sites/default/files/pub-pdf/directorioserviciosvbg.pdf), [Regional gender violence directory](https://refugiolatinoamericano.com/wp-content/uploads/2026/05/Directorio-Regional-de-Denuncia-contra-la-Violencia-hacia-la-Mujer-Migrante-yo-Refugiada.pdf).
- Cuba. [Official national numbering plan](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000330003PDFE.pdf), [Toxicology network](https://retoxlac.org/wp-content/uploads/2024/07/Directorio-RETOXLAC-2024.pdf), [Hospital directory](https://travel.state.gov/content/dam/NEWadoptionassets/pdfs/LOCAL%20HOSPITALS_Mar2025.pdf), [Cáritas diocesan contacts](https://caritascuba.org/contactos-2/), [Cáritas older adults program](https://caritascuba.org/programa-de-personas-mayores/), [Legal aid offices](https://www.exteriores.gob.es/DocumentosAuxiliaresSC/Cuba/LA%20HABANA%20%28C%29/Listado%20Bufetes%20Cuba.pdf), [Gender violence support directory](https://ogatcuba.org/directorio-de-ayudas/).
- Haiti. [Foreign ministry emergency numbers](https://mae.gouv.ht/services/numeros-durgence), [Health Ministry directory](https://www.mspp.gouv.ht/dpmmt/docs/LEPA%20JUILLET%202025.pdf), [Social assistance offices](https://faes.gouv.ht/nous-contactez/), [World Food Programme](https://es.wfp.org/contactos), [Human rights network offices](https://web.rnddh.org/nous-contacter/contact-des-bureaux-du-reseau/), [Support for survivors](https://www.gov.uk/government/publications/haiti-guidance-for-victims-of-rape-and-sexual-assault/haiti-guidance-for-victims-of-rape-and-sexual-assault).

### Correcting directory entries

1. Compare the entry with the provider's current public information. Prioritize emergency and shelter contacts. Use published administrative numbers for routine verification of emergency services.
2. Correct the entry and update its sources and review date. Use `phone-confirmed` only after a conversation with the provider confirms the listed details.
3. Remove unavailable or unsafe contacts promptly. Keep an entry only while it has a reliable public contact channel.
4. Run the directory validator before publishing updated entries.

## Checks

```sh
npm run validate:directory
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks on pushes and pull requests targeting `develop` or `main`. A separate job builds the container and checks the public routes and PWA assets in both local and Vercel read-only modes. To repeat the container check locally while it is running, use `node scripts/check-deployment.mjs`. [CI runs](https://github.com/KevinYax11/SendaSafe/actions)

## Prepare a Vercel deployment

The repository includes a Vercel configuration for Next.js. Running on localhost or Docker needs no paid service. Keeping the repository on GitHub makes the source and CI available. Running the app online requires an active deployment. Vercel Hobby covers eligible personal, non-commercial use within its limits. Turso has a free tier with usage limits. [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Turso plans](https://turso.tech/pricing)

1. Import the GitHub repository in Vercel and select **Next.js**. Use `main` as the production branch and `develop` for preview when configured. Use Node.js 22 and keep the default Next.js build settings. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
2. For a portfolio demo, the directory, guidance and offline downloads work on Vercel with the versioned catalog and no environment variables. To enable persistent comments and directory edits, connect a Turso database and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the Vercel environment. Use separate Preview and Production databases. The app creates its tables on first use. Local Docker uses its SQLite volume, while Vercel uses the configured database. [Vercel Turso integration](https://vercel.com/marketplace/tursocloud/database)
3. To enable Administration, also set `SENDASAFE_ADMIN_PASSWORD` (at least 16 characters) and `SENDASAFE_SESSION_SECRET` (at least 32 characters) as server-only variables. Generate a unique pair for each environment. Keep them out of Git and use the HTTPS preview URL for sign-in.
4. In the preview, run `node scripts/check-deployment.mjs <preview-url>`. Verify the country selector, navigation, and a saved country offline. With Turso configured, submit and moderate a sample comment and verify it persists after redeploying the preview.
