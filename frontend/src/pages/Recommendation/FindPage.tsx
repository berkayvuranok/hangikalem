import { PenMedia } from '@/components/pen/PenMedia'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'
import { useWizardStore } from '@/stores/wizardStore'
import type { RecommendationItem, WizardAnswers } from '@/types'
import { inkLabels, priorityLabels, purposeLabels, thicknessLabels } from '@/utils/format'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

const purposes = Object.entries(purposeLabels)
const thicknesses = Object.entries(thicknessLabels)
const inks = Object.entries(inkLabels)
const priorities = Object.entries(priorityLabels)

export function FindPage() {
  const setAnswers = useWizardStore((s) => s.setAnswers)
  const saved = useWizardStore((s) => s.answers)
  const [step, setStep] = useState(0)
  const [answers, setLocal] = useState<WizardAnswers>(
    saved ?? {
      purpose: '',
      writing_thickness: '',
      ink_type: '',
      smoothness: 7,
      weight_preference: 4,
      budget: 500,
      priorities: [],
    },
  )
  const [results, setResults] = useState<RecommendationItem[] | null>(null)

  const rec = useMutation({
    mutationFn: () => api.recommend(answers),
    onSuccess: (data) => {
      setAnswers(answers)
      setResults(data.recommendations)
    },
  })

  const next = () => {
    if (step < 6) setStep(step + 1)
    else rec.mutate()
  }

  if (rec.isPending) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          className="mb-6 h-16 w-16 rounded-full border-2 border-brass border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <h1 className="font-serif text-3xl">Senin için en uygun kalemleri buluyoruz...</h1>
      </div>
    )
  }

  if (results) {
    const best = results[0]
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {best && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-xs tracking-[0.2em] text-brass uppercase">Senin için en iyi seçim</p>
            <h1 className="mt-3 font-serif text-4xl md:text-6xl">
              {best.pen.brand_name} {best.pen.name}
            </h1>
            <div className="mt-8 flex justify-center">
              <PenMedia pen={best.pen} className="h-80" />
            </div>
            <CircleScore value={best.score} />
            <div className="mx-auto mt-10 max-w-xl text-left">
              <h2 className="font-medium">Neden bunu öneriyoruz?</h2>
              <ul className="mt-3 space-y-2 text-[var(--muted)]">
                {best.reasons.map((r) => (
                  <li key={r}>✦ {r}</li>
                ))}
              </ul>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Güçlü yönleri</p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                    {best.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">Zayıf yönleri</p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                    {best.weaknesses.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <p>
                  <span className="font-medium">Kimler için uygun? </span>
                  {best.suitable_for.join(', ')}
                </p>
                <p>
                  <span className="font-medium">Kimler için değil? </span>
                  {best.not_suitable_for.join(', ')}
                </p>
              </div>
              <Link to={`/pens/${best.pen.slug}`} className="mt-8 inline-block">
                <Button>Kalemi incele</Button>
              </Link>
            </div>
          </motion.section>
        )}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {results.slice(1).map((r, i) => (
            <motion.div
              key={r.pen.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (i + 1) }}
              className="surface rounded-2xl p-5"
            >
              <p className="text-xs text-brass">%{r.score} uyum</p>
              <h3 className="mt-1 font-medium">
                {r.pen.brand_name} {r.pen.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{r.reasons[0]}</p>
              <Link to={`/pens/${r.pen.slug}`} className="mt-4 inline-block text-sm underline">
                Detay
              </Link>
            </motion.div>
          ))}
        </div>
        <button type="button" className="mt-10 text-sm text-[var(--muted)]" onClick={() => { setResults(null); setStep(0) }}>
          Baştan başla
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 h-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-full bg-ink dark:bg-brass" style={{ width: `${((step + 1) / 7) * 100}%` }} />
      </div>
      <p className="text-xs tracking-widest text-[var(--muted)] uppercase">Adım {step + 1} / 7</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mt-6"
        >
          {step === 0 && (
            <Step title="Ne için kullanacaksın?">
              <div className="grid gap-3 sm:grid-cols-2">
                {purposes.map(([k, l]) => (
                  <Choice key={k} active={answers.purpose === k} onClick={() => setLocal({ ...answers, purpose: k })}>
                    {l}
                  </Choice>
                ))}
              </div>
            </Step>
          )}
          {step === 1 && (
            <Step title="Nasıl yazmayı seviyorsun?">
              <div className="grid gap-3 sm:grid-cols-2">
                {thicknesses.map(([k, l]) => (
                  <Choice key={k} active={answers.writing_thickness === k} onClick={() => setLocal({ ...answers, writing_thickness: k })}>
                    {l}
                  </Choice>
                ))}
              </div>
            </Step>
          )}
          {step === 2 && (
            <Step title="Mürekkep tercihin?">
              <div className="grid gap-3 sm:grid-cols-2">
                {inks.map(([k, l]) => (
                  <Choice key={k} active={answers.ink_type === k} onClick={() => setLocal({ ...answers, ink_type: k })}>
                    {l}
                  </Choice>
                ))}
              </div>
            </Step>
          )}
          {step === 3 && (
            <Step title="Yazım hissi">
              <div className="flex justify-between text-sm text-[var(--muted)]">
                <span>Kontrollü</span>
                <span>Kaygan</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={answers.smoothness}
                onChange={(e) => setLocal({ ...answers, smoothness: Number(e.target.value) })}
                className="mt-4 w-full"
              />
              <p className="mt-2 tabular-nums">{answers.smoothness}/10</p>
            </Step>
          )}
          {step === 4 && (
            <Step title="Kalemin ağırlığı">
              <div className="flex justify-between text-sm text-[var(--muted)]">
                <span>Hafif</span>
                <span>Ağır</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={answers.weight_preference}
                onChange={(e) => setLocal({ ...answers, weight_preference: Number(e.target.value) })}
                className="mt-4 w-full"
              />
              <p className="mt-2 tabular-nums">{answers.weight_preference}/10</p>
            </Step>
          )}
          {step === 5 && (
            <Step title="Bütçe">
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={answers.budget}
                onChange={(e) => setLocal({ ...answers, budget: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-3 text-2xl tabular-nums">₺{answers.budget}{answers.budget >= 5000 ? '+' : ''}</p>
            </Step>
          )}
          {step === 6 && (
            <Step title="Önceliğin ne?">
              <div className="flex flex-wrap gap-2">
                {priorities.map(([k, l]) => {
                  const on = answers.priorities.includes(k)
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setLocal({
                          ...answers,
                          priorities: on
                            ? answers.priorities.filter((p) => p !== k)
                            : [...answers.priorities, k],
                        })
                      }
                      className={`rounded-full border px-4 py-2 text-sm ${on ? 'border-ink bg-ink text-white dark:border-brass dark:bg-brass dark:text-black' : 'border-[var(--line)]'}`}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </Step>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="mt-10 flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Geri
        </Button>
        <Button onClick={next} disabled={!canContinue(step, answers)}>
          {step === 6 ? 'Kalemlerimi bul' : 'İleri'}
        </Button>
      </div>
    </div>
  )
}

function canContinue(step: number, a: WizardAnswers): boolean {
  if (step === 0) return Boolean(a.purpose)
  if (step === 1) return Boolean(a.writing_thickness)
  if (step === 2) return Boolean(a.ink_type)
  return true
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-4xl">{title}</h1>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-2xl border px-5 py-6 text-left ${active ? 'border-ink shadow-lg dark:border-brass' : 'border-[var(--line)]'}`}
    >
      {children}
    </motion.button>
  )
}

function CircleScore({ value }: { value: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto mt-8 h-[140px] w-[140px]">
      <svg width="140" height="140" className="-rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={r} stroke="var(--line)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          stroke="#C4A574"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.2 }}
        />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center font-serif text-2xl" aria-live="polite">
        %{value} Uyum
      </p>
    </div>
  )
}
