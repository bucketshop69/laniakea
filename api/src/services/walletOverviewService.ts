import { getWalletOverview } from './vybeService';
import { getUserInterests } from './userInterestsService';
import { WalletOverviewResponse, ProfileOverview, UserInterest } from '../types/wallet';

/**
 * Get comprehensive wallet overview combining Vybe data and user interests
 */
export const getWalletOverviewWithInterests = async (
  walletAddress: string,
  userId: string
): Promise<WalletOverviewResponse> => {
  try {
    // Fetch wallet data from Vybe
    const walletData: ProfileOverview = await getWalletOverview(walletAddress);
    
    // Fetch user interests from feed system
    const userInterests: UserInterest[] = await getUserInterests(userId);
    
    // Generate recommendations based on interests and wallet data
    const recommendations = generateRecommendations(userInterests, walletData);
    
    // Construct the complete response
    const response: WalletOverviewResponse = {
      wallet: {
        address: walletData.walletAddress,
        totalValue: walletData.totalValue,
        change24h: walletData.change24h,
        changePercent24h: walletData.changePercent24h,
        tokenCount: walletData.tokenCount,
      },
      userInterests,
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
    
    return response;
  } catch (error) {
    console.error('[WalletOverviewService] Failed to get wallet overview with interests:', error);
    throw error;
  }
};

/**
 * Generate recommendations based on user interests and wallet data
 */
const generateRecommendations = (
  userInterests: UserInterest[], 
  walletData: ProfileOverview
): Array<{ type: 'token' | 'protocol' | 'nft_collection'; name: string; reason: string; relevanceScore: number }> => {
  const recommendations = [];
  
  // Example recommendation logic
  const topInterests = userInterests
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
  
  for (const interest of topInterests) {
    if (interest.interestType === 'token') {
      recommendations.push({
        type: 'token' as const,
        name: interest.interestValue,
        reason: `Based on your previous activity with similar tokens, and market trends`,
        relevanceScore: interest.relevanceScore,
      });
    } else if (interest.interestType === 'protocol') {
      recommendations.push({
        type: 'protocol' as const,
        name: interest.interestValue,
        reason: `Based on your activity in this protocol ecosystem`,
        relevanceScore: interest.relevanceScore,
      });
    } else if (interest.interestType === 'nft_collection') {
      recommendations.push({
        type: 'nft_collection' as const,
        name: interest.interestValue,
        reason: `Based on your interest in this NFT collection`,
        relevanceScore: interest.relevanceScore,
      });
    }
  }
  
  // Add a generic recommendation if no specific interests found
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'token' as const,
      name: 'SOL',
      reason: 'Solana is the base currency for the ecosystem',
      relevanceScore: 0.5,
    });
  }
  
  return recommendations;
};