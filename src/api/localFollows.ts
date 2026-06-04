import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLLOWING_KEY = '@following_vendors';

async function getFollowingSet(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(FOLLOWING_KEY);
    return data ? new Set<string>(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

async function saveFollowingSet(set: Set<string>): Promise<void> {
  await AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify([...set]));
}

export async function isFollowing(vendorId: string): Promise<boolean> {
  const set = await getFollowingSet();
  return set.has(vendorId);
}

/** Returns the new following state */
export async function toggleFollow(vendorId: string): Promise<boolean> {
  const set = await getFollowingSet();
  if (set.has(vendorId)) {
    set.delete(vendorId);
    await saveFollowingSet(set);
    return false;
  } else {
    set.add(vendorId);
    await saveFollowingSet(set);
    return true;
  }
}

export async function getAllFollowing(): Promise<string[]> {
  const set = await getFollowingSet();
  return [...set];
}
