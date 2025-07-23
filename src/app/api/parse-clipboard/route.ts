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
Your job: read a raw clipboard message, extract key fields, validate the chosen identifier (phone OR account), and return a strict JSON object.

**Input Parameters**
country_code = "${countryCode}"        # ISO-2, e.g. "LY", "NG"
id_mode      = "${idMode}"             # "phone" | "account"
text         = """${clipboard}"""

**What to Extract (in order)**
1. full_name  = first clear person/company name (≥2 words, alphabetic).
2. bank_name  = any known bank/fintech brand. If you set this, DO NOT set city.
3. city       = only if NO bank_name is found. Detect a city (not a country); ignore country words.
4. Depending on id_mode:
   - "phone"   ⇒ return first valid phone number, no account_number.
   - "account" ⇒ return longest valid account number, no phone_number.

**Global Numeric Ignore Rules**
Ignore any numeric token that:
- Looks like a money amount (has currency words/symbols or thousand/decimal separators).
- Is < 6 digits or clearly an OTP/PIN (surrounded by “code”, “otp”, “pin”…).

**Phone Validation (id_mode = "phone")**
- Normalize: remove spaces/dashes/parentheses; keep leading “+”.
- If number starts with “+”, its country calling code must match country_code.
- Otherwise, accept a local format if length matches an allowed NSN length (see COUNTRY_PHONE_RULES).
- If allow_leading_zero = true, one leading “0” is allowed.
- Mark {phone_number_valid} = "yes" if it fits length & pattern; else "no" and fill {validation_error} briefly.

**Account Validation (id_mode = "account")**
- Choose the longest digit/alnum sequence compatible with COUNTRY_ACCOUNT_RULES.
- IBAN: exact length + MOD-97 == 1.
- Non-IBAN: just check length & charset; run checksum if defined (e.g., NG NUBAN).
- Mark {account_number_valid} = "yes" if it passes; else "no" with short {validation_error}.

**Country Rules (examples, extend as needed)**
COUNTRY_PHONE_RULES = {
"NG": { "country_calling_code":"234", "nsn_lengths":[10,11], "allow_leading_zero":true },
"LY": { "country_calling_code":"218", "nsn_lengths":[9], "allow_leading_zero":true },
"US": { "country_calling_code":"1", "nsn_lengths":[10], "allow_leading_zero":false }
/* extend as needed */
}

COUNTRY_ACCOUNT_RULES = {
"NG": { "type":"NUBAN", "length":10, "charset":"digits" },
"LY": { "type":"LOCAL", "length":23, "charset":"digits" },
"US": { "type":"LOCAL", "length_range":[9,12,17], "charset":"digits" },
"DE": { "type":"IBAN", "length":22, "charset":"alnum" }
/* extend as needed */
}


**Output (STRICT JSON, no markdown, no extra keys)**
{
  "full_name": "",
  "phone_number": "",
  "bank_name": "",
  "city": "",
  "account_number": "",
  "account_number_valid": "yes|no",
  "phone_number_valid": "yes|no",
  "validation_error": ""
}

**Mandatory Constraints**
- Always include all keys. Use "" for not-applicable fields.
- If id_mode = "phone": account_number = "" and account_number_valid = "no".
- If id_mode = "account": phone_number = "" and phone_number_valid = "no".
- If bank_name is set, city must be "".
- Respond ONLY with the JSON.

**Example (id_mode="account", country_code="NG")**
Input:
  HALIMA SULAIMAN
  9035941238
  PALMPAY
  NERA 5000

Output:
{
  "full_name": "HALIMA SULAIMAN",
  "phone_number": "",
  "bank_name": "PALMPAY",
  "city": "",
  "account_number": "9035941238",
  "account_number_valid": "yes",
  "phone_number_valid": "no",
  "validation_error": ""
}
`.trim();



  // 3 ️⃣  Call the model (default to GPT-4o-mini or fallback)
  const { text: llmOutput } = await generateText({
  model: openai("gpt-4o"),
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
