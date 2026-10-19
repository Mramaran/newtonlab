import { fieldsFor, TYPE_NAMES, UNKNOWN_OPTIONS } from '../fields'
import { FIELD_COLORS } from '../highlight'
import type { SupportedSpec } from '../physics/spec'

interface Props {
  spec: SupportedSpec
  onChange: (spec: SupportedSpec) => void
  /** lock while the student is predicting */
  disabled?: boolean
}

export function ParamsPanel({ spec, onChange, disabled }: Props) {
  const fields = fieldsFor(spec)
  const values = spec as unknown as Record<string, number>

  const set = (key: string, raw: string) => {
    const v = Number(raw)
    if (raw === '' || !Number.isFinite(v)) return
    onChange({ ...spec, [key]: v } as SupportedSpec)
  }

  return (
    <div className="params">
      <div className="params-type">
        <span className="badge">{TYPE_NAMES[spec.type]}</span>
        {spec.type === 'pulley' && (
          <label className="unknown">
            Setup
            <select
              value={spec.setup}
              disabled={disabled}
              onChange={(e) => onChange({ ...spec, setup: e.target.value === 'table' ? 'table' : 'atwood' })}
            >
              <option value="atwood">Two hanging masses (Atwood)</option>
              <option value="table">Block on a table + hanging mass</option>
            </select>
          </label>
        )}
        <label className="unknown">
          Find
          <select
            value={spec.unknown}
            disabled={disabled}
            onChange={(e) => onChange({ ...spec, unknown: e.target.value } as SupportedSpec)}
          >
            {UNKNOWN_OPTIONS[spec.type].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {fields.map((f) => {
        const value = values[f.key]
        // Let the slider reach the parsed value even when it is beyond the usual range.
        const max = Math.max(f.max, value)
        return (
          <div className="field" key={f.key}>
            <label htmlFor={`f-${f.key}`}>
              <span className="dot" style={{ background: FIELD_COLORS[f.key] }} aria-hidden="true" />
              <span className="sym">{f.symbol}</span> {f.label}
            </label>
            <input
              style={{ accentColor: FIELD_COLORS[f.key] }}
              type="range"
              min={f.min}
              max={max}
              step={f.step}
              value={value}
              disabled={disabled}
              aria-label={f.label}
              onChange={(e) => set(f.key, e.target.value)}
            />
            <div className="num">
              <input
                id={`f-${f.key}`}
                type="number"
                min={f.min}
                step={f.step}
                value={value}
                disabled={disabled}
                onChange={(e) => set(f.key, e.target.value)}
              />
              <span className="unit">{f.unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
