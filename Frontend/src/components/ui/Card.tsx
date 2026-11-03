import type { HTMLAttributes } from 'react'
import './ui.css'

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Orange outline, used for the top-ranked hotel. */
  accent?: boolean
  /** Lifts a little on hover. */
  hover?: boolean
}

export default function Card({ accent, hover, className, ...rest }: Props) {
  const classes = ['card', accent && 'card-accent', hover && 'card-hover', className]
  return <div {...rest} className={classes.filter(Boolean).join(' ')} />
}
