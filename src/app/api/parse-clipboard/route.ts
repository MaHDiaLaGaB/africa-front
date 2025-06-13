import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // 1. Read the raw clipboard text
  const { prompt } = (await req.json()) as { prompt?: string }
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  // 2. Build the extraction instruction
  const extractionPrompt = [
    'Extract the customer’s name, bank/country, and phone/account number from the following clipboard text.',
    'Respond ONLY with a JSON object: {"name":"…","bankCountry":"…","phoneAccount":"…"}',
    '',
    prompt,
  ].join('\n')

  // 3. Call the model (default to gpt-3.5-turbo)
  const { text } = await generateText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-3.5-turbo'),
    prompt: extractionPrompt,
  })

  // 4. Return that JSON string directly
  return new NextResponse(text, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
