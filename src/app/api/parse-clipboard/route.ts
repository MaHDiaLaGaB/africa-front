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
Your job is to read a raw clipboard message sent by a customer, identify financial/contact fields, and return a strict JSON object.
You MUST validate phone numbers and bank-account numbers per the provided country's standards.

**Knowledge & Validation Sources**
1. Phone numbers:
   • Normalize using E.164 rules (strip spaces, dashes, parentheses; keep leading “+”).
   • Validate using each country's official or de-facto national numbering plan:
     - Allowed national significant number (NSN) lengths.
     - Required/optional leading zero.
     - Acceptable prefixes for mobile/landline if known.
     - Country calling code must match if number is in international format.
   • If available, use a library-equivalent logic to libphonenumber (length + pattern), otherwise fall back to regex/length tables in COUNTRY_PHONE_RULES.

2. Bank accounts:
   • For IBAN countries: check exact IBAN length AND apply MOD-97 checksum.
   • For non-IBAN countries: verify length & charset against COUNTRY_ACCOUNT_RULES.
     - If a checksum algorithm exists (e.g., NG NUBAN, US ABA routing), apply it.
     - Otherwise, length & character-set validation only.

**Input Parameters**
country_code = "${countryCode}"        # ISO-2 (e.g. "LY", "NG", "US")
id_mode      = "${idMode}"             # "phone" | "account"
text         = """${clipboard}"""

**Country Rules (examples, extend as needed)**
COUNTRY_PHONE_RULES = {
  "NG": {
    "country_calling_code": "234",
    "nsn_lengths": [10, 11],
    "allow_leading_zero": true,
    "regex_local": "^(0?)(7[0-9]|8[01]|9[01])\\d{8}$"  # example for mobile
  },
  "LY": {
    "country_calling_code": "218",
    "nsn_lengths": [9],
    "allow_leading_zero": true,
    "regex_local": "^(0?)(9[1-5]|2[1-7])\\d{7}$"
  },
  "US": {
    "country_calling_code": "1",
    "nsn_lengths": [10],
    "allow_leading_zero": false,
    "regex_local": "^[2-9]\\d{2}[2-9]\\d{6}$"
  }
  and many african countries...
}

COUNTRY_ACCOUNT_RULES = {
  "NG": { "type":"NUBAN", "length":10, "charset":"digits", "checksum":"mod10_custom" },
  "LY": { "type":"LOCAL", "length":23, "charset":"digits" },
  "US": { "type":"ABA/Account", "length_range":[9,12,17], "charset":"digits" },
  "DE": { "type":"IBAN", "length":22, "charset":"alnum", "checksum":"iban_mod97" }
  /* ... add more ... */
}

**Extraction Rules**
1. {full_name}: First explicit person/company name (first line-like tokenized phrase with ≥2 words and letters).
2. {bank_name}: Any known/obvious bank or fintech brand string (from a curated list or keyword match).
   ⛔ If {bank_name} is found, DO NOT fill {city}.
3. {city}: A city/region only if NO {bank_name} is found.
4. {id_mode} switch:
   - If "phone":
       • Find the FIRST phone-like pattern.
       • Return {phone_number}, validate it.
       • DO NOT return {account_number} (leave as "").
   - If "account":
       • Find the LONGEST sequence matching the expected bank pattern for {country_code}.
       • Return {account_number}, validate it.
       • DO NOT return {phone_number} (leave as "").

**Phone-specific Repair & Filtering (only when id_mode = "phone")**
1. Candidate scan:
   • Extract all digit sequences (keep “+” if present) of length ≥ 7.  
   • DROP any sequence that:
     - Appears with currency markers (e.g., $, €, £, ₦, د.ل, LYD, NGN, “NERA/NAIRA”, “USD”), or
     - Contains a decimal point or comma (e.g., “5,000”, “12.50”), or
     - Has total digits < MIN_NSN_LENGTH for the country.
2. Repair attempt (normalization):
   • Remove spaces, dashes, parentheses. Preserve leading “+” if present.
   • If number starts with country_calling_code (e.g., “234…” for NG), accept as international.
   • Else if allow_leading_zero is true and the first digit isn't “0”, prepend “0” once.
   • Else if no leading “+” AND no leading “0”, but the digit length == allowed NSN length, accept as local.
3. Validate after repair using COUNTRY_PHONE_RULES:
   • Check final length is in nsn_lengths.
   • If regex_local is defined, it must match.
   • If international format (“+” present), country_calling_code MUST match country_code.
4. Choose the **first** candidate that passes. If none pass, return the first candidate you found but mark it invalid.
5. Output
   • {phone_number}: the normalized (possibly repaired) value.
   • {phone_number_valid}: "yes" if all checks pass; "no" otherwise.
   • {validation_error}: short reason if "no" (e.g., "length 8 < min 9", "bad country code +971").

**Money / Small-number Ignore Rule (both modes)**
Before considering any numeric token as phone/account:
   • Ignore tokens with currency words/symbols.
   • Ignore tokens shorter than the minimal valid length for the respective mode (phone/account).
   • Ignore obvious codes (OTP, 2FA) when length < 6 or surrounded by words like “code”, “otp”, “pin”.


**Phone Validation Steps (pseudo)**
1. Extract candidate.
2. Normalize: remove non-digits (keep leading “+” if present).
3. If starts with “+”, ensure it matches COUNTRY_PHONE_RULES[country_code].country_calling_code.
4. Else:
   - If allow_leading_zero: one leading “0” allowed; strip it for NSN length check.
   - Check NSN length ∈ nsn_lengths.
5. Match country regex if provided.
6. Set {phone_number_valid} = "yes" if all checks pass else "no", and give short reason in {validation_error} if "no".

**Account Validation Steps (pseudo)**
1. Extract candidate (longest valid-looking token).
2. If IBAN:
   - Check length exact match.
   - Uppercase, move first 4 chars to end, convert letters to numbers (A=10..Z=35), run MOD97 == 1.
3. If non-IBAN:
   - Check length + charset.
   - If a checksum rule exists, run it (return "no" if fails).
4. Set {account_number_valid} accordingly, {validation_error} if invalid.

**Output Format (STRICT JSON, no extra keys, no markdown)**
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

**Additional Constraints**
- Always return ALL keys (fill with empty string if not applicable).
- If {id_mode="phone"}, {account_number} must be "", {account_number_valid} must be "no".
- If {id_mode="account"}, {phone_number} must be "", {phone_number_valid} must be "no".
- {validation_error} is empty if everything is valid.
- Respond ONLY with the JSON object. Do NOT wrap in markdown or add comments.

**Example (id_mode="account", country_code="NG")**
Input text:
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
}`.trim();



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
