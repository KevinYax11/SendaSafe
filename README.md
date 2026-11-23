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

The country selector also offers general guidance when a local directory is unavailable.

Each published catalog has at least 45 resources and five distinct numbers in each category. The validator also enforces the expanded per-category totals in the original catalogs.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open [SendaSafe locally](http://localhost:3000).

### Run with Docker

With Docker Engine and Docker Compose running, start the frontend and API together.

```sh
docker compose up --build
```

Open [SendaSafe locally](http://localhost:3000). The multi-stage image runs the Next.js standalone server as a non-root user on port 3000. The container has an HTTP health check.

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

GitHub Actions runs these checks on pushes and pull requests targeting `develop` or `main`. A separate job builds the container and checks that the home page, stylesheet, and public API work from the running image. To repeat the container check locally while it is running, use `node scripts/check-deployment.mjs`. [CI runs](https://github.com/KevinYax11/SendaSafe/actions)

## Deployment

Import the repository as a Next.js project in Vercel and use `main` as the production branch. The current directory can run without environment variables. After deploying a preview, check that the home page and both API endpoints respond before promoting to production. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
