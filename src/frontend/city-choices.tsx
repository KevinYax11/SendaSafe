import { cityLabel, type City } from './directory-geography'

export function CityChoices({ cities, onChoose }: { cities: City[]; onChoose: (city: City) => void }) {
  if (!cities.length) return null
  return (
    <ul className="city-choices" aria-label="Municipios sugeridos">
      {cities.map(city => <li key={city.id}>
        <button type="button" onClick={() => onChoose(city)}>{cityLabel(city)}</button>
      </li>)}
    </ul>
  )
}
