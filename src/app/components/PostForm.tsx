import { X } from "lucide-react";
import { z } from "zod";

interface PostFormProps {
  setShowPostForm: (value: boolean) => void;
}

const postSchema = z.object({
  post: z.string().min(1, "Post is required"),
  datetime: z.string().min(1, "Date and time are required"),
});

export default function PostForm({ setShowPostForm }: PostFormProps) {
  return (
    <div className="w-screen h-screen absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-white p-6 border border-[#EAECF0] rounded-lg shadow-[0px_8px_8px_-4px_#10182808,0px_20px_24px_-4px_#10182814]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = {
              post: formData.get("post") as string,
              datetime: formData.get("datetime") as string,
            };

            const result = postSchema.safeParse(data);
            if (!result.success) {
              console.error(result.error.errors);
              return;
            }

            console.log("Form data is valid:", result.data);
            // await postToLinkedIn(result.data);
            setShowPostForm(false);
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-lg font-semibold text-[#101828]">New post</h2>
          <div>
            <label htmlFor="post" className="text-[#344054] font-medium">
              Post
            </label>
            <textarea
              name="post"
              rows={6}
              cols={50}
              className="w-full p-2 border border-[#EAECF0] rounded"
              placeholder="Write your post here..."
            />
          </div>
          <div>
            <label htmlFor="datetime">Select date</label>
            <input
              type="datetime-local"
              id="datetime"
              name="datetime"
              className="w-full p-2 border border-[#EAECF0] rounded"
            />
          </div>
          <div>
            <label htmlFor="accounts" className="text-[#344054] font-medium">
              Select accounts
            </label>
            <div className="w-full p-2 border border-[#EAECF0] rounded">
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center justify-center gap-1 border border-[#D0D5DD] text-[#344054] text-sm font-medium px-1 py-0.5 rounded cursor-pointer">
                  <span>Olivia</span>
                  <X size={14} color="#98A2B3" />
                </span>
                <span className="flex items-center justify-center gap-1 border border-[#D0D5DD] text-[#344054] text-sm font-medium px-1 py-0.5 rounded cursor-pointer">
                  <span>Phoenix</span>
                  <X size={14} color="#98A2B3" />
                </span>
                <span className="flex items-center justify-center gap-1 border border-[#D0D5DD] text-[#344054] text-sm font-medium px-1 py-0.5 rounded cursor-pointer">
                  <span>Paul</span>
                  <X size={14} color="#98A2B3" />
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="bg-white text-sm text-[#344054] font-semibold py-2 px-3 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
              style={{
                border: "2px solid",
                borderImageSource:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
              onClick={() => setShowPostForm(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-[#1570EF] text-sm text-white font-semibold py-2 px-3 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
              style={{
                border: "2px solid",
                borderImageSource:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
