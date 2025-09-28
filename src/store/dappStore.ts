import { create } from 'zustand';

export type SupportedDapp = 'saros' | 'meteora' | 'drift' | 'jupiter';

const SAROS_POOLS_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/pool';
const DEFAULT_QUERY = 'size=20&order=-volume24h&page=1';

interface SarosTokenInfo {
  mintAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
}

interface SarosPairInfo {
  pair: string;
  binStep: number;
  activeBin: number;
  tokenX: SarosTokenInfo & { address?: string };
  tokenY: SarosTokenInfo & { address?: string };
  reserveX: string;
  reserveY: string;
  baseFactor: number;
  totalLiquidity: number;
  volume24h: number;
  fees24h: number;
  feesApr: number;
  rewardsApr: number;
  apr24h: number;
}

export interface SarosPoolOverview {
  tokenX: SarosTokenInfo;
  tokenY: SarosTokenInfo;
  totalLiquidity: number;
  volume24h: number;
  fees24h: number;
  apr24h: number;
  pairs: SarosPairInfo[];
}

interface SarosDataState {
  pools: SarosPoolOverview[];
  isLoading: boolean;
  error?: string;
  lastFetched?: number;
  lastQuery?: string;
}

interface DappStoreState {
  selectedDapp: SupportedDapp;
  saros: SarosDataState;
  setSelectedDapp: (dapp: SupportedDapp) => void;
  fetchSarosData: (options?: { force?: boolean; endpointOverride?: string }) => Promise<void>;
}

export const useDappStore = create<DappStoreState>((set, get) => ({
  selectedDapp: 'saros',
  saros: {
    pools: [],
    isLoading: false,
  },
  setSelectedDapp: (dapp) => {
    set({ selectedDapp: dapp });
    if (dapp === 'saros') {
      void get().fetchSarosData({ force: true });
    }
  },
  fetchSarosData: async ({ force, endpointOverride } = {}) => {
    const { saros } = get();
    const query = endpointOverride ?? DEFAULT_QUERY;

    if (
      !force &&
      saros.lastFetched &&
      saros.lastQuery === query &&
      Date.now() - saros.lastFetched < 60_000
    ) {
      return;
    }

    set({ saros: { ...saros, isLoading: true, error: undefined, lastQuery: query } });

    try {
      const response = await fetch(`${SAROS_POOLS_ENDPOINT}?${query}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Saros pools: ${response.status}`);
      }

      const payload = await response.json();
      const rawPools: SarosPoolOverview[] = (payload?.data?.data ?? [])
        .map((entry: any) => ({
          tokenX: {
            mintAddress: entry.tokenX?.mintAddress ?? '',
            name: entry.tokenX?.name ?? '',
            symbol: entry.tokenX?.symbol ?? '',
            decimals: Number(entry.tokenX?.decimals ?? 0),
            image: entry.tokenX?.image,
          },
          tokenY: {
            mintAddress: entry.tokenY?.mintAddress ?? '',
            name: entry.tokenY?.name ?? '',
            symbol: entry.tokenY?.symbol ?? '',
            decimals: Number(entry.tokenY?.decimals ?? 0),
            image: entry.tokenY?.image,
          },
          totalLiquidity: Number(entry.totalLiquidity ?? 0),
          volume24h: Number(entry.volume24h ?? 0),
          fees24h: Number(entry.fees24h ?? 0),
          apr24h: Number(entry.apr24h ?? 0),
          pairs: Array.isArray(entry.pairs)
            ? entry.pairs.map((pair: any) => ({
              pair: pair.pair,
              binStep: Number(pair.binStep ?? 0),
              activeBin: Number(pair.activeBin ?? 0),
              tokenX: {
                mintAddress: pair.tokenX?.mintAddress ?? '',
                name: pair.tokenX?.name ?? '',
                symbol: pair.tokenX?.symbol ?? '',
                decimals: Number(pair.tokenX?.decimals ?? 0),
                image: pair.tokenX?.image,
                address: pair.tokenX?.address,
              },
              tokenY: {
                mintAddress: pair.tokenY?.mintAddress ?? '',
                name: pair.tokenY?.name ?? '',
                symbol: pair.tokenY?.symbol ?? '',
                decimals: Number(pair.tokenY?.decimals ?? 0),
                image: pair.tokenY?.image,
                address: pair.tokenY?.address,
              },
              reserveX: String(pair.reserveX ?? '0'),
              reserveY: String(pair.reserveY ?? '0'),
              baseFactor: Number(pair.baseFactor ?? 0),
              totalLiquidity: Number(pair.totalLiquidity ?? 0),
              volume24h: Number(pair.volume24h ?? 0),
              fees24h: Number(pair.fees24h ?? 0),
              feesApr: Number(pair.feesApr ?? 0),
              rewardsApr: Number(pair.rewardsApr ?? 0),
              apr24h: Number(pair.apr24h ?? 0),
            }))
            : [],
        }));

      set({
        saros: {
          pools: rawPools,
          isLoading: false,
          lastFetched: Date.now(),
          lastQuery: query,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Saros data fetch failed. Verify connectivity to Saros public API.', error);
      set({
        saros: {
          pools: [],
          isLoading: false,
          error: message,
          lastFetched: Date.now(),
          lastQuery: query,
        },
      });
    }
  },
}));
