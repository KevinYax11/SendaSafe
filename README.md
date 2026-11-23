# SendaSafe

A mobile-first directory of emergency services, health resources, and migrant support in Latin America. The first country with published directory data is Guatemala.

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

The Guatemala directory uses institutional publications from [CONRED](https://conred.gob.gt/sinaprese2026/), [ACNUR Guatemala](https://help.unhcr.org/guatemala/), the [Guatemalan Migration Institute](https://proteccion.igm.gob.gt/index.php/es), [Scalabrini migrant shelters](https://scalabriniguate.org/contacto/), and the organizations that provide each service. The [country catalog](data/countries/gt/resources.json) records the source links and review date for every entry. Users can open them from the resource cards.

## Checks

```sh
npm run validate:directory
npm run lint
npm run typecheck
npm run build
```
