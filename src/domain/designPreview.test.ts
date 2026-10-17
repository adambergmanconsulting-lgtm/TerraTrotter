import { describe, expect, it } from 'vitest'
import { designPreviewEnabled } from './designPreview'

describe('designPreviewEnabled', () => {
  it('stays on for the dev server and for localhost', () => {
    expect(designPreviewEnabled(true, 'adambergmanconsulting-lgtm.github.io')).toBe(true)
    expect(designPreviewEnabled(false, 'localhost')).toBe(true)
    expect(designPreviewEnabled(false, '127.0.0.1')).toBe(true)
  })

  it('stays off on the public site', () => {
    expect(designPreviewEnabled(false, 'adambergmanconsulting-lgtm.github.io')).toBe(false)
  })
})
