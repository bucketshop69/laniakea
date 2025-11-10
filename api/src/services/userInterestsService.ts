import { UserInterest } from '../types/wallet';

// For now, we'll create a mock implementation that returns sample data
// In a real implementation, this would query the Supabase feed_items table
export const getUserInterests = async (userId: string): Promise<UserInterest[]> => {
  try {
    // In a real implementation, this would be a Supabase query like:
    // const { data, error } = await supabase
    //   .from('feed_items')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false })
    //   .limit(100);
    
    // For now, return mock data to simulate user interests
    console.log(`[UserInterestsService] Fetching interests for user: ${userId}`);
    
    // Mock user interests based on their activity
    const mockInterests: UserInterest[] = [
      {
        id: '1',
        userId,
        interestType: 'token',
        interestValue: 'SOL',
        relevanceScore: 0.9,
        lastUpdated: new Date().toISOString(),
        source: 'transaction',
      },
      {
        id: '2',
        userId,
        interestType: 'token',
        interestValue: 'USDC',
        relevanceScore: 0.8,
        lastUpdated: new Date().toISOString(),
        source: 'transaction',
      },
      {
        id: '3',
        userId,
        interestType: 'protocol',
        interestValue: 'Meteora',
        relevanceScore: 0.7,
        lastUpdated: new Date().toISOString(),
        source: 'annotation',
      },
      {
        id: '4',
        userId,
        interestType: 'protocol',
        interestValue: 'Drift',
        relevanceScore: 0.6,
        lastUpdated: new Date().toISOString(),
        source: 'transaction',
      },
    ];

    return mockInterests;
  } catch (error) {
    console.error('[UserInterestsService] Failed to fetch user interests:', error);
    throw error;
  }
};