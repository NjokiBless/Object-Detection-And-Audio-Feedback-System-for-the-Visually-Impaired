import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "safety_contacts_v1";
const MYINFO_KEY = "safety_myinfo_v1";

export type EmergencyContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type MyInfo = {
  fullName?: string;   // optional: first + last
  phone?: string;      // user phone if not available from server
};

export async function loadContacts(): Promise<EmergencyContact[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveContacts(list: EmergencyContact[]) {
  const trimmed = list.slice(0, 3); // enforce max 3
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
}

export async function loadMyInfo(): Promise<MyInfo> {
  const raw = await AsyncStorage.getItem(MYINFO_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function saveMyInfo(info: MyInfo) {
  await AsyncStorage.setItem(MYINFO_KEY, JSON.stringify(info));
}
