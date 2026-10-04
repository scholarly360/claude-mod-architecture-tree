import type { Register } from 'claude-code'

// Architecture Mindmap
//
// prompt.submit: if the prompt uses architecture or design words, attach a
// hidden instruction (the event's `context`) that asks Claude to answer with
// the system architecture as a box-drawing tree. The prompt text itself is
// left as typed.

// Words that mean architecture on their own.
const ARCHITECTURE_WORDS = [
  'architecture',
  'architectural',
  'architect',
  'system overview',
  'component diagram',
  'high-level structure',
  'high level structure',
  'tech stack',
  'microservice',
  'monolith',
  'data flow',
  'codebase structure',
  'project structure',
  'module structure',
  'how is this structured',
  'how is it structured',
  'how is this organized',
  'how is it organized',
]

// "design" is also a UI, graphic and fashion word, so on its own it does not
// count. It counts next to a software word, in either order.
const SOFTWARE_WORDS =
  'system|software|api|database|db|schema|service|backend|back-end|' +
  'class|pattern|module|infrastructure|infra|data|high-level|high level|' +
  'low-level|low level|technical|tech|app|application|platform|doc|document'

const DESIGN_PATTERNS = [
  new RegExp(`\\b(?:${SOFTWARE_WORDS})\\s+design\\b`, 'i'),
  new RegExp(`\\bdesign\\s+(?:of|for)\\s+(?:the\\s+|this\\s+|our\\s+|a\\s+)?(?:${SOFTWARE_WORDS})\\b`, 'i'),
  /\bdesign\s+(?:doc|document|review|decision|overview)s?\b/i,
  /\bdesign\s+patterns?\b/i,
  /\bdesign\s+(?:the|a|an)\s+(?:system|architecture|api|database|schema|service)\b/i,
]

// A prompt that asks for another format, or no diagram, is left alone.
const OPT_OUT = /\b(?:no|without|skip|don't|do not)\s+(?:a\s+)?(?:diagram|mindmap|mind map|mermaid)\b/i

/** True when the prompt reads like a request about architecture or design. */
export function isArchitecturePrompt(text: string): boolean {
  const body = text.trim()
  if (body === '' || body.startsWith('/') || OPT_OUT.test(body)) {
    return false
  }
  const lower = body.toLowerCase()
  if (ARCHITECTURE_WORDS.some(word => lower.includes(word))) {
    return true
  }
  return DESIGN_PATTERNS.some(pattern => pattern.test(body))
}

/** The hidden instruction attached to a matching prompt. */
export function mindmapInstruction(): string {
  return [
    'The architecture-tree plugin matched this prompt: it is about architecture or design.',
    'Besides answering the question, draw the architecture as a box-drawing tree.',
    '',
    'Method:',
    '- Read the code first (entry points, top-level folders, config, manifests) so every node names something that exists. Do not invent components. If the architecture is not in the repository, mark the guesses as assumptions.',
    '- Put the tree in ONE fenced code block with no language tag, then 2 to 4 sentences of notes after it.',
    '',
    'Tree rules:',
    '- The first line is the project name.',
    '- Use ├── for a branch that has siblings below it, └── for the last branch at a level, and │ for a line that continues past a branch. Indent each level by 4 columns, using "│   " or "    ".',
    '- 4 to 7 top-level branches, such as: Entry points, Core modules, Data and storage, External services, Infrastructure, Cross-cutting (auth, logging, config). Rename them to fit the project.',
    '- At most 4 levels deep and about 40 nodes in all. Group instead of listing everything.',
    '- Keep each label under about 40 characters: a name, with a short role after " - " if it helps.',
    '- One node per line. No blank lines inside the block.',
    '',
    'Example shape:',
    '```',
    'my-app',
    '├── Entry points',
    '│   ├── src/server.ts',
    '│   └── src/cli.ts',
    '├── Core modules',
    '│   ├── router',
    '│   └── services',
    '└── Data and storage',
    '    ├── Postgres',
    '    └── Redis cache',
    '```',
  ].join('\n')
}

export const register: Register = on => {
  on('prompt.submit', ($, e, next) => {
    // Only prompts the person typed (or sent from an app or the SDK). A plugin's,
    // a peer's or a notification's message is passed on untouched.
    const kind = e.origin?.kind
    const isPerson = kind === undefined || kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    if (!isPerson || !isArchitecturePrompt(e.text)) {
      return next(e)
    }
    $.ui.toast('Architecture words found: asking for a mindmap')
    return next({ ...e, context: [...(e.context ?? []), mindmapInstruction()] })
  })
}
