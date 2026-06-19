import { localDb } from "./index.ts";

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const users = localDb.getUsers();
    let user = users.find((u) => u.uid === uid);
    
    if (user) {
      if (user.email !== email) {
        user.email = email;
        localDb.saveUsers(users);
      }
    } else {
      const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      user = {
        id: nextId,
        uid: uid,
        email: email,
        status: "Active" as const,
        passportLevel: 1,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      localDb.saveUsers(users);
    }
    
    return user;
  } catch (error) {
    console.error("Database user getOrCreate failed:", error);
    throw new Error("Failed to register or retrieve user in database.", { cause: error });
  }
}
