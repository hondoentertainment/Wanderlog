import { TravelLocation, Achievement, LocationType } from '../types';

// All available achievements
export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
    {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Log your first trip',
        icon: 'fa-shoe-prints',
        condition: '1+ trips logged'
    },
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Log 5 trips',
        icon: 'fa-compass',
        condition: '5+ trips logged'
    },
    {
        id: 'globetrotter',
        name: 'Globetrotter',
        description: 'Visit 5 different countries',
        icon: 'fa-globe',
        condition: '5+ countries visited'
    },
    {
        id: 'world-traveler',
        name: 'World Traveler',
        description: 'Visit 10 different countries',
        icon: 'fa-earth-americas',
        condition: '10+ countries visited'
    },
    {
        id: 'state-hopper',
        name: 'State Hopper',
        description: 'Visit 10 US states',
        icon: 'fa-flag-usa',
        condition: '10+ US states visited'
    },
    {
        id: 'road-warrior',
        name: 'Road Warrior',
        description: 'Visit 25 US states',
        icon: 'fa-road',
        condition: '25+ US states visited'
    },
    {
        id: 'five-star',
        name: 'Five Star Explorer',
        description: 'Rate 5 trips with 5 stars',
        icon: 'fa-star',
        condition: '5+ perfect ratings'
    },
    {
        id: 'solo-adventurer',
        name: 'Solo Adventurer',
        description: 'Take 3 solo trips',
        icon: 'fa-person-hiking',
        condition: '3+ solo trips'
    },
    {
        id: 'squad-goals',
        name: 'Squad Goals',
        description: 'Take 3 group trips',
        icon: 'fa-people-group',
        condition: '3+ group trips'
    },
    {
        id: 'foodie',
        name: 'Foodie',
        description: 'Mention food in 5 trip highlights',
        icon: 'fa-utensils',
        condition: '5+ food-related trips'
    },
    {
        id: 'jet-setter',
        name: 'Jet Setter',
        description: 'Log 20 trips',
        icon: 'fa-plane',
        condition: '20+ trips logged'
    },
    {
        id: 'veteran',
        name: 'Travel Veteran',
        description: 'Log 50 trips',
        icon: 'fa-medal',
        condition: '50+ trips logged'
    }
];

/**
 * Calculate which achievements are unlocked based on travel history
 */
export const calculateAchievements = (locations: TravelLocation[]): Achievement[] => {
    const now = new Date().toISOString();
    const unlocked: Achievement[] = [];

    // Count various stats
    const totalTrips = locations.length;
    const countries = new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name)).size;
    const states = new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name)).size;
    const fiveStarTrips = locations.filter(l => l.rating === 5).length;
    const soloTrips = locations.filter(l => l.companions?.includes('solo')).length;
    const groupTrips = locations.filter(l => l.companions?.includes('group') || l.companions?.includes('friends')).length;
    const foodieTrips = locations.filter(l =>
        l.likes.some(like => like.toLowerCase().includes('food') || like.toLowerCase().includes('restaurant') || like.toLowerCase().includes('cuisine'))
    ).length;

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
        let isUnlocked = false;

        switch (achievement.id) {
            case 'first-steps':
                isUnlocked = totalTrips >= 1;
                break;
            case 'explorer':
                isUnlocked = totalTrips >= 5;
                break;
            case 'globetrotter':
                isUnlocked = countries >= 5;
                break;
            case 'world-traveler':
                isUnlocked = countries >= 10;
                break;
            case 'state-hopper':
                isUnlocked = states >= 10;
                break;
            case 'road-warrior':
                isUnlocked = states >= 25;
                break;
            case 'five-star':
                isUnlocked = fiveStarTrips >= 5;
                break;
            case 'solo-adventurer':
                isUnlocked = soloTrips >= 3;
                break;
            case 'squad-goals':
                isUnlocked = groupTrips >= 3;
                break;
            case 'foodie':
                isUnlocked = foodieTrips >= 5;
                break;
            case 'jet-setter':
                isUnlocked = totalTrips >= 20;
                break;
            case 'veteran':
                isUnlocked = totalTrips >= 50;
                break;
        }

        unlocked.push({
            ...achievement,
            unlockedAt: isUnlocked ? now : undefined
        });
    }

    return unlocked;
};

/**
 * Get progress toward next achievement
 */
export const getAchievementProgress = (locations: TravelLocation[]): { next: Achievement | null; progress: number; total: number } => {
    const achievements = calculateAchievements(locations);
    const locked = achievements.filter(a => !a.unlockedAt);

    if (locked.length === 0) {
        return { next: null, progress: 0, total: 0 };
    }

    // Find the closest achievement to unlock
    const totalTrips = locations.length;
    const countries = new Set(locations.filter(l => l.type === LocationType.COUNTRY).map(l => l.name)).size;
    const states = new Set(locations.filter(l => l.type === LocationType.STATE).map(l => l.name)).size;

    // Simple heuristic: return progress on explorer/globetrotter based on what's closest
    if (totalTrips < 5) {
        return { next: locked.find(a => a.id === 'explorer') || locked[0], progress: totalTrips, total: 5 };
    }
    if (countries < 5) {
        return { next: locked.find(a => a.id === 'globetrotter') || locked[0], progress: countries, total: 5 };
    }
    if (states < 10) {
        return { next: locked.find(a => a.id === 'state-hopper') || locked[0], progress: states, total: 10 };
    }

    return { next: locked[0], progress: 0, total: 1 };
};
