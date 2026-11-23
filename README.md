# SendaSafe

A Spanish-language, mobile-first directory of emergency services, health resources, and migrant support in Latin America. Visitors can choose the country they are in, search by municipality or service, and open public phone or WhatsApp contacts from each resource card.

## Coverage

| Country | Resources | Catalog |
| --- | ---: | --- |
| Chile | 45 | [CL](data/countries/cl/resources.json) |
| Colombia | 47 | [CO](data/countries/co/resources.json) |
| Costa Rica | 46 | [CR](data/countries/cr/resources.json) |
| El Salvador | 48 | [SV](data/countries/sv/resources.json) |
| Guatemala | 49 | [GT](data/countries/gt/resources.json) |
| Honduras | 47 | [HN](data/countries/hn/resources.json) |
| Mexico | 49 | [MX](data/countries/mx/resources.json) |
| Panama | 48 | [PA](data/countries/pa/resources.json) |

The country selector also offers general guidance when a local directory is unavailable.

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

- Chile. [ACNUR Chile](https://help.unhcr.org/chile/ayuda-y-orientacion/), [Corporación de Asistencia Judicial de Tarapacá y Antofagasta](https://www.cajta.cl/index.php/nuestras-oficinas) and [Chilean emergency services](https://www.consulado.gob.cl/emergencias-en-chile).
- Colombia. [ACNUR Colombia](https://help.unhcr.org/colombia/bienvenido-a/donde-encontrar-ayuda/asistencia-legal/) and [Migración Colombia](https://www.migracioncolombia.gov.co/acerca-de-migracion-colombia/directorios/puntos-de-atencion).
- Costa Rica. [Ministry of Labor](https://www.mtss.go.cr/dml/servicios/) and [ACNUR Costa Rica](https://help.unhcr.org/costarica/serviciosacnur).
- El Salvador. [ACNUR El Salvador](https://help.unhcr.org/elsalvador/donde-encontrar-ayuda/numeros-de-telefonos-de-emergencia/) and [Scalabrini International Migration Network](https://www.simn-global.org/centros-scalabrinianos/centro/casa-del-migrante-scalabrini-el-salvador/).
- [Guatemala catalog](data/countries/gt/resources.json). Sources include [CONRED](https://conred.gob.gt/sinaprese2026/), [ACNUR Guatemala](https://help.unhcr.org/guatemala/) and [Scalabrini migrant shelters](https://scalabriniguate.org/contacto/).
- Honduras. [ACNUR Honduras](https://help.unhcr.org/honduras/wp-content/uploads/sites/56/2025/02/Ruta-de-Atencion-Danli.pdf) and the [National Migration Institute](https://inm.gob.hn/contacto).
- [Mexico catalog](data/countries/mx/resources.json). Sources include [ACNUR México](https://help.unhcr.org/mexico/donde-encontrar-ayuda/albergues/), the [Secretaría de Seguridad y Protección Ciudadana](https://www.gob.mx/sspc/es/articulos/sabes-cual-es-la-diferencia-entre-los-numeros-088-089-y-911?idiom=es) and [IMSS](https://www.imss.gob.mx/prensa/archivo/202611/585).
- Panama. [ACNUR Panamá](https://help.unhcr.org/panama/donde-encontrar-ayuda/) and the [National Migration Service](https://www.migracion.gob.pa/contacto/).

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
