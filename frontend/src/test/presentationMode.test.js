import { beforeEach, describe, expect, it } from 'vitest'
import { setPresentationMode } from '../utils/presentationMode'

describe('presentation mode', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists the enabled state to localStorage', () => {
    setPresentationMode(true)
    expect(window.localStorage.getItem('aegis_presentation_mode')).toBe('true')
  })

  it('persists the disabled state to localStorage', () => {
    setPresentationMode(false)
    expect(window.localStorage.getItem('aegis_presentation_mode')).toBe('false')
  })

  it('notifies listeners when the mode changes', () => {
    let notified = false
    window.addEventListener('presentation-mode-changed', () => {
      notified = true
    })
    setPresentationMode(true)
    expect(notified).toBe(true)
  })
})
