// tests/mocks/user.js
export const User = {
 

  findOne: async ({ email, username }) => {
    if (email === "exist@test.com" || username === "existuser") {
      return {
        _id: "1",
        email: "exist@test.com",
        username: "existuser",
        password: "$2a$10$hashed", 
      };
    }
    return null;
  },

  create: async ({ username, email, password }) => ({
    _id: "new-id",
    username,
    email,
    password,
    save: async () => {},
  }),
};
