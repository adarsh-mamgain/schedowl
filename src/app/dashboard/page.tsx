const TODOS = [
  {
    title: "Connect your LinkedIn account",
    description: "Connect your LinkedIn account to start using the app",
    done: true,
  },
  {
    title: "Publish your first post",
    description:
      "Use the magic of AI and your imagination to create and publish your first post.",
    done: false,
  },
  {
    title: "Unlock your gift",
    description:
      "We have something special for you. complete the above steps and claim your special gift.",
    done: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="w-screen h-screen grid grid-cols-12">
      <aside className="h-full col-span-2 border-r border-[#EAECF0] p-4">
        <div>
          <span>Company</span>
        </div>
      </aside>
      <main className="col-span-10 h-full p-6">
        <section className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-semibold text-[#101828]">Your Dashboard</h1>
            <p className="text-sm text-[#475467]">
              Manage your team members and their account permissions here.
            </p>
          </div>
          <div>
            <button
              className="bg-[#1570EF] text-sm text-white font-semibold py-2 px-3 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
              style={{
                border: "2px solid",
                borderImageSource:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            >
              Write Post
            </button>
          </div>
        </section>
        <section className="flex flex-col gap-4 border border-[#EAECF0] rounded-[16px] p-6 text-sm mb-6">
          {TODOS.map((todo, index) => (
            <div key={todo.title} className="flex gap-6 items-center relative">
              <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow-[0px_1px_2px_0px_#1018280D]">
                O
              </div>
              {index < TODOS.length - 1 && (
                <div className="absolute left-5 top-11 h-2 border-l-2 border-[#EAECF0]"></div>
              )}
              <div className="flex flex-col">
                <h2
                  className={`font-semibold ${
                    todo.done ? "text-[#101828]" : "text-[#475467]"
                  }`}
                >
                  {todo.title}
                </h2>
                <p className="text-[#475467]">{todo.description}</p>
              </div>
            </div>
          ))}
          <button
            className="w-max bg-white text-[#344054] py-2 px-3 font-semibold py-2.5 border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset]"
            style={{
              border: "2px solid",
              borderImageSource:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
            type="submit"
          >
            Get Started
          </button>
        </section>

        <section className="flex flex-col gap-4 border border-[#EAECF0] rounded-[16px] p-6 text-sm"></section>
      </main>
    </div>
  );
}
