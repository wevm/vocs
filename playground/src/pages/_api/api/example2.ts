export default function handler(request: Request) {
  const search = new URL(request.url).searchParams

  return Response.json({
    message: 'I am a server!',
    ...search,
  })
}
