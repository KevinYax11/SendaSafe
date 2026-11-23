import { countriesResponse } from '../../../../backend/directory/requests'

export function GET() {
  return countriesResponse()
}
