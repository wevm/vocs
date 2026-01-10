import type { ExportedHandler } from 'vocs'

export default {
  fetch: async (request) => {
    const search = new URL(request.url).searchParams

    return Response.json({
      message: 'I am a server!',
      ...search,
    })
  },
} satisfies ExportedHandler
