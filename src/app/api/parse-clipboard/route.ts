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
if id_mode is "phone":
- return the first phone-like pattern found.
- extract full_name, phone_number, and city (if no bank_name is found).
- do NOT return account_number or bank_name if not present.
- If words are joined by dots (e.g., "Aboubakar.damagaram.ta.kaya"), treat them as separate words — assume dots are word boundaries.


if id_mode is "account":
- return the longest digit(/letter) sequence matching the expected pattern from the country_code.
- always try to extract and return a bank_name if mentioned in the text.
- fall back to city only if bank_name is not found.
- do NOT return phone_number.

1. full_name = the first explicit person or company name found.
2. bank_name = any bank or financial institution name;
   ⛔ If you find one, DO NOT include city in output.
   ✅ If id_mode is "account", always return the bank_name if it exists.
3. city = native-language city label *only* if bank_name is missing.
4. account_number = the longest digit(/letter) sequence matching the expected pattern.
5. phone_number = the first phone-like pattern (allow “+”, spaces, dashes), then normalize:
   - Replace "+" with "00"
   - If number does not start with "0" or "00", add leading "0"


**Validation Rules**
• account_number_valid = "yes" if format (and checksum when applicable) passes, else "no".
• If invalid, add a short human-readable reason to validation_error.

**Phone Number Normalization**
• If phone_number starts with "+", replace it with "00".
• If phone_number does not start with "0", prepend "0".
• Do not return any phone number starting with "+" or lacking a leading "0" or "00".


Note:
- If id_mode is "phone", do not return account_number.
- If id_mode is "account", do not return phone_number.

---

**Examples**

📌 These real-world examples illustrate tricky cases where names and cities/banks are on the same line:

**Example 1 (id_mode = "phone")**
Ww8470
86632243 Adamou baboul gorangobachi 70 000

✅ Extracted as:
{
  "full_name": "Adamou",
  "phone_number": "086632243",
  "bank_name": "",
  "city": "baboul gorangobachi",
  "account_number": "",
  "account_number_valid": "no",
  "phone_number_valid": "yes",
  "validation_error": ""
}

Example 2 (id_mode = "phone")

Ww8474  
98553891 Ibourhm ahmani Bonkoukou 30 000
✅ Extracted as:
{
  "full_name": "Ibourhm",
  "phone_number": "098553891",
  "bank_name": "",
  "city": "Bonkoukou",
  "account_number": "",
  "account_number_valid": "no",
  "phone_number_valid": "yes",
  "validation_error": ""
}

Example 3 (id_mode = "account") - Nigeria
02______5  
0781349933  
Muhammad zabariyya G T  
10,000 nre

G T is a bank name in nigeria, so we extract it.

✅ Extracted as:
{
  "full_name": "Muhammad zabariyya",
  "phone_number": "",
  "bank_name": "G T",
  "city": "",
  "account_number": "0781349933",
  "account_number_valid": "yes",
  "phone_number_valid": "no",
  "validation_error": ""
}

Example 4 (id_mode = "phone") - dot-separated words
Ww8475  
Aboubakar.damagaram.ta.kaya.5.000  
96316152

✅ Extracted as:
{
  "full_name": "Aboubakar",
  "phone_number": "096316152",
  "bank_name": "",
  "city": "damagaram takaya",
  "account_number": "",
  "account_number_valid": "no",
  "phone_number_valid": "yes",
  "validation_error": ""
}


Output Format (strict JSON, no extra keys)
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