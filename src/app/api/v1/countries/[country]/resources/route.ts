import { resourcesResponse } from '../../../../../../backend/directory/requests'

export async function GET(request: Request, { params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  return resourcesResponse(request.url, country)
}
