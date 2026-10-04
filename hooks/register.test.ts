import { expect, test } from 'claude-code/testing'

import { isArchitecturePrompt, mindmapInstruction } from './register'

test('matches architecture and software design words', () => {
  const yes = [
    'Explain the architecture of this repo',
    'give me a system overview',
    'What is the tech stack and data flow here?',
    'Write a design doc for the billing service',
    'Review the database design',
    'design the system for 10k requests per second',
    'Which design patterns does this use?',
    'how is this structured?',
  ]
  for (const text of yes) {
    expect(isArchitecturePrompt(text)).toBe(true)
  }
})

test('ignores unrelated prompts, UI design, slash commands and opt-outs', () => {
  const no = [
    'fix the failing test in utils.ts',
    'design a logo for my cafe',
    'make the button design nicer',
    '/architecture-review',
    'explain the architecture but no diagram please',
    '',
  ]
  for (const text of no) {
    expect(isArchitecturePrompt(text)).toBe(false)
  }
})

test('the instruction names the tree rules', () => {
  const text = mindmapInstruction()
  expect(text).toContain('box-drawing tree')
  expect(text).toContain('├──')
  expect(text).toContain('└──')
  expect(text).not.toContain('mermaid')
})

test('a matching prompt gets the instruction as hidden context, text unchanged', async ($, on) => {
  on('prompt.submit', (_$, e) => ({ text: e.text, context: e.context }))

  const hit = await $.prompt.submit({ text: 'Describe the architecture of this project' })
  expect(hit.text).toBe('Describe the architecture of this project')
  expect(hit.context?.length).toBe(1)
  expect(hit.context?.[0]).toContain('mindmap')

  const miss = await $.prompt.submit({ text: 'rename the variable foo to bar' })
  expect(miss.context).toBeUndefined()
})
