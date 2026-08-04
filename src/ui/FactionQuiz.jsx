import { useState } from 'react'
import { QUIZ, scoreQuiz } from '../game/factionQuiz'
import { t } from '../game/i18n'

export default function FactionQuiz({ onDone, onSkip }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])

  function pick(opt) {
    const next = [...answers, opt]
    if (step + 1 < QUIZ.length) {
      setAnswers(next)
      setStep(step + 1)
    } else {
      onDone(scoreQuiz(next))
    }
  }

  const q = QUIZ[step]

  return (
    <div className="overlay">
      <div className="modal faction-modal">
        <h2>{t('¿Qué clase de recolector eres?')}</h2>
        <p className="modal-desc">
          {t('Responde y el Gremio te sugerirá una facción y verá algo de ti en tu Compañero.')}
        </p>
        <div className="quiz-progress">
          {QUIZ.map((_, i) => (
            <span key={i} className={`quiz-dot${i <= step ? ' filled' : ''}`} />
          ))}
        </div>
        <p className="quiz-question">{t(q.q)}</p>
        {q.options.map((opt) => (
          <button key={opt.label} className="faction-card quiz-option" onClick={() => pick(opt)}>
            <span className="faction-body">{t(opt.label)}</span>
          </button>
        ))}
        <button className="ghost-btn" onClick={onSkip}>
          {t('Prefiero elegir sin cuestionario')}
        </button>
      </div>
    </div>
  )
}
