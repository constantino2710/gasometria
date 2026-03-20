import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RequestPayload = {
  animalId?: string
  fileName?: string
  mimeType?: string
  fileBase64?: string
}

type ExtractedExamValues = {
  ph: number | null
  pco2: number | null
  po2: number | null
  be: number | null
  hco3: number | null
  tco2: number | null
  so2: number | null
  na: number | null
  k: number | null
  ica: number | null
  glicose: number | null
  hematocrito: number | null
  hemoglobina: number | null
  temperatura: number | null
  cloro: number | null
}

const FIXED_PROMPT = `
Voce e um sistema de extracao de dados clinicos especializado em exames laboratoriais.

Sua unica funcao e identificar e extrair valores numericos especificos de um exame.

REGRAS CRITICAS:
- NAO interpretar
- NAO explicar
- NAO adicionar texto
- NAO inferir valores
- NAO retornar nada alem do JSON
- Se um valor nao estiver presente, retornar null
- Nunca inventar dados

EXTRAIR APENAS OS SEGUINTES PARAMETROS:
- pH
- pCO2
- pO2
- BE (Excesso de Base)
- HCO3 (Bicarbonato)
- tCO2
- sO2
- Sodio (Na)
- Potassio (K)
- iCa (Calcio ionico / ionizado)
- Glicose
- Hematocrito
- Hemoglobina
- Temperatura
- Cloro (Cloreto)

REGRAS DE IDENTIFICACAO:
- pH -> "pH"
- pCO2 -> "pCO2", "PaCO2"
- pO2 -> "pO2", "PaO2"
- BE -> "BE", "Base Excess", "Excesso de Base"
- HCO3 -> "HCO3", "Bicarbonato"
- tCO2 -> "tCO2", "TCO2"
- sO2 -> "sO2", "SatO2", "Saturacao de O2"
- Sodio -> "Na", "Sodio"
- Potassio -> "K", "Potassio"
- iCa -> "iCa", "Calcio ionico", "Calcio ionizado"
- Glicose -> "Glicose", "Glucose", "Glu"
- Hematocrito -> "Ht", "Hematocrito"
- Hemoglobina -> "Hb", "Hemoglobina"
- Temperatura -> "Temp", "Temperatura"
- Cloro -> "Cl", "Cloro", "Cloreto", "Chloride"

REGRAS DE EXTRACAO:
- Extrair APENAS o numero (sem unidade)
- Converter virgula para ponto (ex: 7,35 -> 7.35)
- Nao incluir texto junto do numero
- Se houver multiplos valores para o mesmo parametro, pegar o mais recente/mais evidente

FORMATO DE SAIDA OBRIGATORIO:
Retorne APENAS um JSON valido com as chaves:
ph, pco2, po2, be, hco3, tco2, so2, na, k, ica, glicose, hematocrito, hemoglobina, temperatura, cloro

PROIBIDO:
- Retornar texto fora do JSON
- Explicar o exame
- Diagnosticar
- Completar valores ausentes
- Retornar unidades
`.trim()

const RECOVERY_PROMPT = `
Retorne APENAS um JSON valido e completo com todas as 15 chaves obrigatorias:
ph, pco2, po2, be, hco3, tco2, so2, na, k, ica, glicose, hematocrito, hemoglobina, temperatura, cloro.
Se nao encontrar algum valor, use null.
Nao retorne texto fora do JSON.
`.trim()

const EMPTY_EXTRACTED_VALUES: ExtractedExamValues = {
  ph: null,
  pco2: null,
  po2: null,
  be: null,
  hco3: null,
  tco2: null,
  so2: null,
  na: null,
  k: null,
  ica: null,
  glicose: null,
  hematocrito: null,
  hemoglobina: null,
  temperatura: null,
  cloro: null,
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeExtractedValues(raw: unknown): ExtractedExamValues {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  return {
    ph: normalizeNumber(input.ph),
    pco2: normalizeNumber(input.pco2),
    po2: normalizeNumber(input.po2),
    be: normalizeNumber(input.be),
    hco3: normalizeNumber(input.hco3),
    tco2: normalizeNumber(input.tco2),
    so2: normalizeNumber(input.so2),
    na: normalizeNumber(input.na),
    k: normalizeNumber(input.k),
    ica: normalizeNumber(input.ica),
    glicose: normalizeNumber(input.glicose),
    hematocrito: normalizeNumber(input.hematocrito),
    hemoglobina: normalizeNumber(input.hemoglobina),
    temperatura: normalizeNumber(input.temperatura),
    cloro: normalizeNumber(input.cloro),
  }
}

function countExtractedValues(values: ExtractedExamValues): number {
  return Object.values(values).filter((value) => value !== null).length
}

function parseGeminiJson(rawText: string): Record<string, unknown> {
  const trimmed = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  if (!trimmed) {
    return {}
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      try {
        return JSON.parse(`${trimmed}}`) as Record<string, unknown>
      } catch {
        // continua para outras estrategias
      }
    }

    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const possibleJson = trimmed.slice(start, end + 1)
      try {
        return JSON.parse(possibleJson) as Record<string, unknown>
      } catch {
        // continua para outras estrategias
      }
    }

    // Caso comum observado: resposta vem como pares soltos, ex: `"ph": 7.29`
    if (!trimmed.startsWith('{') && trimmed.includes(':')) {
      const wrapped = `{${trimmed}}`
      try {
        return JSON.parse(wrapped) as Record<string, unknown>
      } catch {
        const withoutTrailingComma = wrapped.replace(/,\s*}/g, '}')
        try {
          return JSON.parse(withoutTrailingComma) as Record<string, unknown>
        } catch {
          // continua para fallback final
        }
      }
    }

    // Fallback: tenta extrair pares "chave": numero/null mesmo com JSON truncado.
    const pairRegex = /"([a-zA-Z0-9_]+)"\s*:\s*(-?\d+(?:[.,]\d+)?|null)/g
    const extracted: Record<string, unknown> = {}
    let match: RegExpExecArray | null = null

    while (true) {
      match = pairRegex.exec(trimmed)
      if (!match) {
        break
      }

      const key = match[1]?.trim()
      const rawValue = match[2]?.trim().replace(',', '.')
      if (!key || !rawValue) {
        continue
      }

      extracted[key] = rawValue.toLowerCase() === 'null' ? null : Number(rawValue)
    }

    if (Object.keys(extracted).length > 0) {
      return extracted
    }
  }

  return {}
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY nao configurada no Supabase.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await request.json()) as RequestPayload
    const mimeType = body.mimeType?.trim()
    const fileBase64 = body.fileBase64?.trim()

    if (!mimeType || !fileBase64) {
      return new Response(JSON.stringify({ error: 'mimeType e fileBase64 sao obrigatorios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `
${FIXED_PROMPT}
Animal ID: ${body.animalId ?? 'nao informado'}
Arquivo: ${body.fileName ?? 'nao informado'}
`.trim()

    const generationConfig = {
      maxOutputTokens: 1024,
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          ph: { type: 'NUMBER', nullable: true },
          pco2: { type: 'NUMBER', nullable: true },
          po2: { type: 'NUMBER', nullable: true },
          be: { type: 'NUMBER', nullable: true },
          hco3: { type: 'NUMBER', nullable: true },
          tco2: { type: 'NUMBER', nullable: true },
          so2: { type: 'NUMBER', nullable: true },
          na: { type: 'NUMBER', nullable: true },
          k: { type: 'NUMBER', nullable: true },
          ica: { type: 'NUMBER', nullable: true },
          glicose: { type: 'NUMBER', nullable: true },
          hematocrito: { type: 'NUMBER', nullable: true },
          hemoglobina: { type: 'NUMBER', nullable: true },
          temperatura: { type: 'NUMBER', nullable: true },
          cloro: { type: 'NUMBER', nullable: true },
        },
        required: [
          'ph',
          'pco2',
          'po2',
          'be',
          'hco3',
          'tco2',
          'so2',
          'na',
          'k',
          'ica',
          'glicose',
          'hematocrito',
          'hemoglobina',
          'temperatura',
          'cloro',
        ],
      },
    }

    async function callGemini(promptText: string) {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: fileBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig,
          }),
        },
      )
    }

    const geminiResponse = await callGemini(prompt)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      const status = geminiResponse.status >= 400 && geminiResponse.status < 600 ? geminiResponse.status : 502

      return new Response(JSON.stringify({ error: `Falha no Gemini (${status}): ${errorText}` }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiResponse.json()
    const allParts = Array.isArray(geminiData?.candidates?.[0]?.content?.parts)
      ? geminiData.candidates[0].content.parts
      : []
    let rawText = allParts
      .map((part: { text?: string }) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
    let finishReason = geminiData?.candidates?.[0]?.finishReason ?? null

    if (!rawText) {
      return new Response(
        JSON.stringify({
          extracted: EMPTY_EXTRACTED_VALUES,
          debug: {
            rawText: '',
            parsed: {},
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let parsed = parseGeminiJson(rawText)
    let extracted = normalizeExtractedValues(parsed)

    const shouldRetry =
      countExtractedValues(extracted) <= 1 ||
      (rawText.startsWith('{') && !rawText.endsWith('}')) ||
      finishReason === 'MAX_TOKENS'

    if (shouldRetry) {
      const retryResponse = await callGemini(`${prompt}\n\n${RECOVERY_PROMPT}`)
      if (retryResponse.ok) {
        const retryData = await retryResponse.json()
        const retryParts = Array.isArray(retryData?.candidates?.[0]?.content?.parts)
          ? retryData.candidates[0].content.parts
          : []
        const retryRawText = retryParts
          .map((part: { text?: string }) => (typeof part?.text === 'string' ? part.text : ''))
          .join('')
          .trim()

        const retryParsed = parseGeminiJson(retryRawText)
        const retryExtracted = normalizeExtractedValues(retryParsed)

        if (countExtractedValues(retryExtracted) > countExtractedValues(extracted)) {
          rawText = retryRawText || rawText
          parsed = retryParsed
          extracted = retryExtracted
          finishReason = retryData?.candidates?.[0]?.finishReason ?? finishReason
        }
      }
    }

    return new Response(
      JSON.stringify({
        extracted,
        debug: {
          rawText,
          parsed,
          finishReason,
          extractedCount: countExtractedValues(extracted),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao processar documento.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
