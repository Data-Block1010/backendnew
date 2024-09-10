interface User {
    id: string;
    username: string;
    passwordHash: string;
}

const users: User[] = [];

export class UserModel {
    static async findUserByUsername(username: string): Promise<User | undefined> {
        return users.find(user => user.username === username);
    }

    static async createUser(username: string, passwordHash: string): Promise<void> {
        users.push({ id: new Date().toISOString(), username, passwordHash });
    }
}
