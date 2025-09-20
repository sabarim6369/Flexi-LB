
import { describe, it, expect } from "bun:test";
import * as userController from "../Controllers/authController.js";
import { User } from "./mocks/user.js";
import bcrypt from "bcryptjs";
import { signToken } from "../Utils/jwt.js";
import { createContext } from "./helpers/createContext.js";

describe("User Controller Tests", () => {
  
  it("signup should create new user", async () => {
    const c = createContext({ body: { username: "newuser", email: "new@test.com", password: "123456" } });
    const res = await userController.signup(c, User);
    expect(res.status).toBe(200);
    expect(res.response.user.username).toBe("newuser");
    expect(res.response.token).toBeDefined();
  });

  it("login should return user and token for correct credentials", async () => {
    const hashed = await bcrypt.hash("123456", 10);
    
    User.findOne = async () => ({ _id: "1", email: "exist@test.com", username: "existuser", password: hashed });

    const c = createContext({ body: { email: "exist@test.com", password: "123456" } });
    const res = await userController.login(c, User);
    expect(res.status).toBe(200);
    expect(res.response.token).toBeDefined();
  });



  it("changePassword updates password if old password correct", async () => {
    const hashedOld = await bcrypt.hash("oldpass", 10);
    
    User.findById = async () => ({ password: hashedOld, save: async () => {}, _id: "valid-id" });

    const c = createContext({ body: { oldPassword: "oldpass", newPassword: "newpass" }, user: { id: "valid-id" } });
    const res = await userController.changePassword(c, User);
    expect(res.status).toBe(200);
    expect(res.response.message).toBe("Password updated successfully");
  });

  it("editProfile updates username/email", async () => {
    User.findById = async () => ({ _id: "valid-id", username: "old", email: "old@test.com", save: async () => {} });

    const c = createContext({ body: { username: "newname", email: "new@test.com" }, user: { id: "valid-id" } });
    const res = await userController.editProfile(c, User);
    expect(res.status).toBe(200);
    expect(res.response.user.username).toBe("newname");
    expect(res.response.user.email).toBe("new@test.com");
  });

  it("updateNotifications updates user notifications", async () => {
    User.findById = async () => ({ _id: "valid-id", notifications: { email: true }, save: async () => {} });

    const c = createContext({ body: { notifications: { push: true } }, user: { id: "valid-id" } });
    const res = await userController.updateNotifications(c, User);
    expect(res.status).toBe(200);
    expect(res.response.notifications.push).toBe(true);
  });



  it("checkvalidity should return valid true for correct token", async () => {
    const token = signToken({ id: "valid-id" });
    const c = createContext({ body: { token } });
    const res = await userController.checkvalidity(c);
    expect(res.status).toBe(200);
    expect(res.response.valid).toBe(true);
  });

});
