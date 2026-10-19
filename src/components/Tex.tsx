import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Renders a LaTeX string built by the app (never user HTML). */
export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block })
  return <span className={block ? 'tex tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />
}
