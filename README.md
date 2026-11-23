# SendaSafe

A mobile-first directory of emergency services, health resources, and migrant support in Latin America. The first country with published directory data is Guatemala.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open [SendaSafe locally](http://localhost:3000).

## Directory sources

The Guatemala directory uses institutional publications from [CONRED](https://conred.gob.gt/sinaprese2026/), [ACNUR Guatemala](https://help.unhcr.org/guatemala/), the [Guatemalan Migration Institute](https://proteccion.igm.gob.gt/index.php/es), [Scalabrini migrant shelters](https://scalabriniguate.org/contacto/), and the organizations that provide each service. The [country catalog](data/countries/gt/resources.json) records the source links and review date for every entry. Users can open them from the resource cards.

## Checks

```sh
npm run validate:directory
npm run lint
npm run typecheck
npm run build
```
