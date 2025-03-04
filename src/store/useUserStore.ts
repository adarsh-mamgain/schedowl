// import { create } from "zustand";
// import axios from "axios";

// type User = {
//   id: string;
//   name: string;
//   email: string;
//   password?: string;
//   image?: string;
// };

// type UserStore = {
//   user: User | null;
//   fetchUser: () => Promise<void>;
//   updateUser: (updatedData: Partial<User>) => void;
// };

// export const useUserStore = create<UserStore>((set) => ({
//   user: null,

//   // Fetch user from API
//   fetchUser: async () => {
//     try {
//       const response = await axios.get("/api/user");
//       set({ user: response.data.user });
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   },

//   // Update user data in store
//   updateUser: (updatedData) => {
//     set((state) => ({
//       user: { ...state.user, ...updatedData },
//     }));
//   },
// }));
