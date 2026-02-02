import OpenAI from 'openai'
import { AnalysisResult, AnalysisResultSchema, CommitDiff, ProjectContext } from './types.js'

const SYSTEM_PROMPT = `You are Jeff Dean, Google Senior Fellow. Review code quality with your highest standards.

Give a CODE QUALITY score (1-10) with deep technical analysis.

## GRADING
- 1-3: Poor. Missing basics, needs rework
- 4-5: Average. Most code lands here
- 6: Good. Solid work
- 7: Very good. Top 10%
- 8+: Exceptional. Rare.

## ANALYSIS MUST:
1. Quote actual code snippets from the diff
2. Reference specific file paths and function names
3. Explain WHY with technical reasoning
4. Be specific, not generic
5. When giving a final score, take the full analysis into consideration

Default to 4-5. Justify higher with specific evidence.

## RESPONSE FORMAT
Respond with valid JSON in this exact format:
{
  "score": <number 1-10>,
  "summary": "<one sentence summary of the change>",
  "analysis": "<detailed technical analysis with code quotes>"
}`

const buildUserPrompt = (
  diff: CommitDiff,
  context?: ProjectContext
): string => {
  let prompt = `## PR/Commit Details
- SHA: ${diff.sha}
- Author: ${diff.author}
- Date: ${diff.date}
- Message: ${diff.message}

## Stats
- Additions: ${diff.stats.additions}
- Deletions: ${diff.stats.deletions}

## Files Changed
${diff.files.map((f) => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n')}

## Diff
\`\`\`diff
${diff.files
  .filter((f) => f.patch)
  .map((f) => `// ${f.filename}\n${f.patch}`)
  .join('\n\n')}
\`\`\``

  if (context?.agentsmd) {
    prompt += `\n\n## Project Guidelines (AGENTS.md)
\`\`\`markdown
${context.agentsmd}
\`\`\``
  }

  if (context?.rules && context.rules.length > 0) {
    prompt += `\n\n## Project Rules
${context.rules.join('\n\n')}`
  }

  return prompt
}

export type AnalyzerConfig = {
  apiKey: string
  model?: string
}

export const createAnalyzer = (config: AnalyzerConfig) => {
  const openai = new OpenAI({ apiKey: config.apiKey })
  const model = config.model ?? 'gpt-4o'

  const analyze = async (
    diff: CommitDiff,
    context?: ProjectContext
  ): Promise<AnalysisResult> => {
    const userPrompt = buildUserPrompt(diff, context)

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content) as unknown
    const result = AnalysisResultSchema.parse(parsed)

    return result
  }

  return { analyze }
}

export type Analyzer = ReturnType<typeof createAnalyzer>
