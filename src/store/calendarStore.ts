import { create } from "zustand";
import { PostStatus } from "@prisma/client";

interface CalendarView {
  type: "day" | "week" | "month";
  date: Date;
}

interface Post {
  id: string;
  type: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  socialAccount: {
    id: string;
    name: string;
    type: string;
  };
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  mediaIds?: string[];
}

interface CalendarStore {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  isApproving: boolean;
  setIsApproving: (isApproving: boolean) => void;
  isDeleting: boolean;
  setIsDeleting: (isDeleting: boolean) => void;
  resetState: () => void;
}

const useCalendarStore = create<CalendarStore>()((set) => ({
  view: {
    type: "day",
    date: new Date(),
  },
  setView: (view) => set({ view }),
  selectedPost: null,
  setSelectedPost: (post) => set({ selectedPost: post }),
  isEditing: false,
  setIsEditing: (isEditing) => set({ isEditing }),
  isApproving: false,
  setIsApproving: (isApproving) => set({ isApproving }),
  isDeleting: false,
  setIsDeleting: (isDeleting) => set({ isDeleting }),
  resetState: () =>
    set({
      selectedPost: null,
      isEditing: false,
      isApproving: false,
      isDeleting: false,
    }),
}));

export default useCalendarStore;
