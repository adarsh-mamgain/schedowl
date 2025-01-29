import { X } from "lucide-react";
// import Image from "next/image";

export default function PostForm() {
  return (
    <div className="bg-white p-6 border border-[#EAECF0] rounded-lg shadow-[0px_8px_8px_-4px_#10182808,0px_20px_24px_-4px_#10182814] absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          console.log("----------e.target", e.target);
          const formData = new FormData(e.target as HTMLFormElement);
          console.log("----------formData", formData);
          // const text = formData.get("postText");
          // await postToLinkedIn(text);
          // setShowPostForm(false);
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
                {/* <Image
                  src="/path/to/avatar.jpg"
                  alt="Olivia"
                  className="w-4 h-4 rounded-full mr-1"
                  /> */}
                <span>Olivia</span>
                <X size={14} color="#98A2B3" />
              </span>
              <span className="flex items-center justify-center gap-1 border border-[#D0D5DD] text-[#344054] text-sm font-medium px-1 py-0.5 rounded cursor-pointer">
                {/* <Image
                  src="/path/to/avatar.jpg"
                  alt="Phoenix"
                  className="w-4 h-4 rounded-full mr-1"
                /> */}
                <span>Phoenix</span>
                <X size={14} color="#98A2B3" />
              </span>
              <span className="flex items-center justify-center gap-1 border border-[#D0D5DD] text-[#344054] text-sm font-medium px-1 py-0.5 rounded cursor-pointer">
                {/* <Image
                  src="/path/to/avatar.jpg"
                  alt="Paul"
                  className="w-4 h-4 rounded-full mr-1"
                /> */}
                <span>Paul</span>
                <X size={14} color="#98A2B3" />
              </span>
              {/* Add more chips as needed */}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="bg-white text-sm text-[#344054] font-semibold py-2 px-3 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
            style={{
              border: "2px solid",
              borderImageSource:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
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
  );
}
