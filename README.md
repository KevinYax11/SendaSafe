# SendaSafe

A mobile-first directory of emergency services, health resources, and migrant support in Latin America. The directory currently covers Guatemala and Mexico.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open [SendaSafe locally](http://localhost:3000).

## Architecture

The Next.js app contains a React frontend in `src/frontend`, a server-side directory in `src/backend`, and shared types in `src/shared`. The backend reads the country catalog and applies filters. Both layers run in the same deployment.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/v1/countries` | Lists supported country codes and their directory coverage. |
| `GET /api/v1/countries/{country}/resources` | Returns country metadata and resources. Optional `q` and `category` parameters filter results. |

Try `/api/v1/countries/GT/resources?q=coban&category=migration-and-legal`. A country in the selector with no coverage returns an empty resource list. An unknown country returns `404`, and invalid filters return `400`.

## Directory sources

Each resource card shows the sources and date of review. The catalog stores contact details as strings to preserve domestic short codes, including leading zeroes.

- [Guatemala catalog](data/countries/gt/resources.json). Sources include [CONRED](https://conred.gob.gt/sinaprese2026/), [ACNUR Guatemala](https://help.unhcr.org/guatemala/) and [Scalabrini migrant shelters](https://scalabriniguate.org/contacto/).
- [Mexico catalog](data/countries/mx/resources.json). Sources include [ACNUR México](https://help.unhcr.org/mexico/donde-encontrar-ayuda/albergues/), the [Secretaría de Seguridad y Protección Ciudadana](https://www.gob.mx/sspc/es/articulos/sabes-cual-es-la-diferencia-entre-los-numeros-088-089-y-911?idiom=es) and [IMSS](https://www.imss.gob.mx/prensa/archivo/202611/585).

### Correcting directory entries

The report link in each card opens a public GitHub issue draft with the country code and resource ID. Use it for publicly available service information.

1. Review the report against the provider's current information. Prioritize emergency and shelter contacts. Use published administrative numbers for routine verification of emergency services.
2. Correct the entry and update its sources and review date. Use `phone-confirmed` only after a conversation with the provider confirms the listed details. Record the date and the role of the person confirming the update in the issue, without personal identifiers.
3. Remove unavailable or unsafe contacts promptly. Remove the entry if it no longer has a reliable public contact channel, and document the reason in the issue.
4. Run the directory validator and close the issue once the update is available to users.

## Checks

```sh
npm run validate:directory
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks on pushes and pull requests targeting `develop` or `main`.

## Deployment

Import the repository as a Next.js project in Vercel and use `main` as the production branch. The current directory can run without environment variables. After deploying a preview, check that the home page and both API endpoints respond before promoting to production. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
