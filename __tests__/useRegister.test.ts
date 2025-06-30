import { useRegister } from "@/hooks/UseAuthHook";
import { useAuthStore } from "@/store/AuthStore";
import axios from "axios";
import { renderHook as rtlRenderHook, act, renderHook } from "@testing-library/react";

// Mocks
jest.mock("axios");
jest.mock("@/store/AuthStore", () => ({
  useAuthStore: jest.fn(),
}));

describe("useRegister Hook", () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Zustand store return value
    ((useAuthStore as unknown) as jest.Mock).mockReturnValue({
      setUser: mockSetUser,
    });
  });

  it("registers a new user successfully", async () => {
    const fakeUser = {
      id: "abc-123",
      firstname: "Test",
      lastname: "User",
      email: "test@example.com",
      password: "test123",
      token: "token-xyz",
      profileImage: "",
      currency: "USD",
      theme: "light",
      kycStatus: "not-started",
    };

    // Mock GET to check existing email
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: [] });

    // Mock POST to create user
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: fakeUser,
    });

    const { result } = customRenderHook(() => useRegister());

    await act(async () => {
      const returnedUser = await result.current.register({
        firstName: fakeUser.firstname,
        lastName: fakeUser.lastname,
        email: fakeUser.email,
        password: fakeUser.password,
      });

      expect(returnedUser).toEqual(fakeUser);
      expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({
        id: fakeUser.id,
        firstname: fakeUser.firstname,
        email: fakeUser.email,
        token: fakeUser.token,
      }));
    });
  });

  it("throws error if email already exists", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: [{ email: "test@example.com" }] });

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await expect(
        result.current.register({
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "password",
        })
      ).rejects.toThrow("Email already Existed. Please use a different email.");
    });
  });
});
function customRenderHook(callback: () => { register: (formData: { firstName: string; lastName: string; email: string; password: string; }) => Promise<any>; }) {
    return rtlRenderHook(callback);
}

