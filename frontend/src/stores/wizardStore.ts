import type { WizardAnswers } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type WizardState = {
  answers: WizardAnswers | null
  setAnswers: (answers: WizardAnswers) => void
  clear: () => void
}

export const defaultAnswers: WizardAnswers = {
  purpose: 'study',
  writing_thickness: 'fine',
  ink_type: 'gel',
  smoothness: 7,
  weight_preference: 3,
  budget: 500,
  priorities: ['comfort', 'writing_quality'],
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      answers: null,
      setAnswers: (answers) => set({ answers }),
      clear: () => set({ answers: null }),
    }),
    { name: 'hangikalem-wizard' },
  ),
)
