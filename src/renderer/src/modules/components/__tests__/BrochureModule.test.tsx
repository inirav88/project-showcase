import '../../../../test/polyfill'
import { describe, it, expect } from 'vitest'
import { isDocumentUrl } from '../BrochureModule'

describe('BrochureModule URL & Document Verification', () => {
  it('correctly identifies document and PDF URLs vs project websites', () => {
    // Document URLs (should be true)
    expect(isDocumentUrl('https://showcase.salesstudio.in/media/cmst2st3m000w7tgjuphz8820_DOCUMENT_The_Stately_Brochure.pdf')).toBe(true)
    expect(isDocumentUrl('https://example.com/downloads/brochure.pdf')).toBe(true)
    expect(isDocumentUrl('https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing')).toBe(true)
    expect(isDocumentUrl('https://docs.google.com/document/d/123/edit')).toBe(true)
    expect(isDocumentUrl('https://dropbox.com/s/xyz/brochure.pdf?dl=0')).toBe(true)
    expect(isDocumentUrl('https://s3.amazonaws.com/bucket/brochure.pdf')).toBe(true)

    // Project website homepages (must be FALSE to avoid confusing a website for a brochure)
    expect(isDocumentUrl('https://thestately.co.in/')).toBe(false)
    expect(isDocumentUrl('https://thestately.co.in')).toBe(false)
    expect(isDocumentUrl('https://avyanna.com')).toBe(false)
    expect(isDocumentUrl('https://salesstudio.in')).toBe(false)
    expect(isDocumentUrl('')).toBe(false)
    expect(isDocumentUrl(undefined)).toBe(false)
  })
})
