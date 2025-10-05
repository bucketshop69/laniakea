export const sarosQueryKeys = {
  poolMetadata: (pairAddress: string) => ['saros', 'poolMetadata', pairAddress] as const,
  overviewChart: (days: number | undefined) => ['saros', 'overviewChart', days ?? 'default'] as const,
  binDistribution: (pairAddress: string, params: unknown) => ['saros', 'binDistribution', pairAddress, params] as const,
}
