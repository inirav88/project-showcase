export default function UnknownModule({ type }: { type: string }): JSX.Element {
  return (
    <div data-testid="module-unknown" style={{ display: 'none' }}>
      Unknown module: {type}
    </div>
  )
}
