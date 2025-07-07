import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = 'edge'

/**
 * POST /api/parse-bank-info
 * Body: { clipboard: string; countryCode: string }
 * Returns: the strict JSON produced by the LLM (see prompt).
 */
export async function POST(req: NextRequest) {
  // 1 ️⃣  Read input
  const { clipboard, countryCode, idMode } = (await req.json()) as {
    clipboard?: string
    countryCode?: string
    idMode?: 'phone' | 'account'
  }

  if (!clipboard || !countryCode || !idMode) {
    return NextResponse.json(
      { error: 'Both clipboard and countryCode are required' },
      { status: 400 },
    )
  }

  // 2 ️⃣  Build the rich extraction +- validation prompt
  const extractionPrompt = `
**System**
You are a senior compliance officer and data-extraction engine.
Your job is to read a raw clipboard message sent by a customer, identify financial fields, and return a strict JSON object.
You also validate bank-account numbers according to each country's official standard.

**Knowledge**
• For IBAN-enabled countries, validate using IBAN length + checksum.
• For non-IBAN countries, validate length and character set per your reference table (e.g. LY = 23 digits, NG = 10 digits, US = 9/12-17 digits, …).

**Input Parameters**
country_code = "${countryCode}"
id_mode = "${idMode}"  # "phone" | "account"
text = """${clipboard}"""

**Extraction Rules**
if id_mode is "phone": return the first phone-like pattern found.
if id_mode is "account": return the longest digit(/letter) sequence matching the expected pattern
from the country_code.

1. full_name = the first explicit person or company name found.
2. bank_name = any bank or financial institution name;
   ⛔ If you find one, DO NOT include country in output.
3. country = native-language country label *only* if bank_name is missing.
4. account_number = the longest digit(/letter) sequence matching the expected pattern.
5. phone_number = the first phone-like pattern (allow “+”, spaces, dashes).

**Validation Rules**
• account_number_valid = "yes" if format (and checksum when applicable) passes, else "no".
• If invalid, add a short human-readable reason to validation_error.

Note: If id_mode is "phone", do not return account_number
if id_mode is "account", do not return phone_number.

**Output Format (strict JSON, no extra keys)**
{
  "full_name": "",
  "phone_number": "",
  "bank_name": "",
  "country": "",
  "account_number": "",
  "account_number_valid": "yes|no",
  "phone_number_valid": "yes|no",
  "validation_error": ""
}

  Respond ONLY with the JSON. Do NOT wrap it in Markdown.
  `.trim();



  // 3 ️⃣  Call the model (default to GPT-4o-mini or fallback)
  const { text: llmOutput } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: extractionPrompt
    .replace("{{countryCode}}", countryCode)
    .replace("{{idMode}}",     idMode)        // "phone" | "account"
    .replace("{{clipboard}}",  clipboard),
  temperature: 0,
});


  // 4 ️⃣  Ensure the LLM really gave JSON; if not, bubble the raw output
  try {
    const parsed = JSON.parse(llmOutput)
    return NextResponse.json(parsed, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Model returned non-JSON output', raw: llmOutput },
      { status: 502 },
    )
  }
}
