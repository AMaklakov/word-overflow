import { NextResponse } from 'next/server'

const connections = new Map<string, any>()

export async function POST(request: Request) {
  const body = await request.json()

  const existing = connections.get(body.id) || {}
  if (body.data) {
    connections.set(body.id, {
      ...existing,
      ...body.data,
    })
  }

  // console.log(connections.get(body.id))
  return NextResponse.json(connections.get(body.id))
}
