export default function OverviewModule({ config }: { config: Record<string, any>; projectId: string }): JSX.Element {
  return <div data-testid="module-OVERVIEW">{String(config.heroHeadline ?? 'Overview')}</div>
}
