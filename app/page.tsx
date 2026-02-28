import Image from "next/image";

export default function Home() {
  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
            <Image src="/GC LOGO.png" alt="GC Logo" width={32} height={32} className="object-contain" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Exam Portal</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">timer</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold text-base">00:45:00</span>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm">
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 lg:p-12 relative">
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
            {/* Progress Header */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Question 1 of 30</span>
                <span className="text-primary font-bold text-sm">3%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "3%" }}></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10 flex-1 flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-8">
                1. Which of the following data structures is most efficient for implementing a priority queue?
              </h1>
              <div className="flex flex-col gap-3 flex-1">
                {/* Option 1 */}
                <label className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50">
                  <input defaultChecked className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20" name="question_1" type="radio" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">Array</span>
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none"></div>
                </label>

                {/* Option 2 */}
                <label className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50">
                  <input className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20" name="question_1" type="radio" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">Linked List</span>
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none"></div>
                </label>

                {/* Option 3 */}
                <label className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50">
                  <input className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20" name="question_1" type="radio" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">Heap</span>
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none"></div>
                </label>

                {/* Option 4 */}
                <label className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50">
                  <input className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20" name="question_1" type="radio" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">Stack</span>
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  Back
                </button>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-500 hover:text-primary font-medium transition-colors text-sm">
                    <span className="material-symbols-outlined text-[20px]">flag</span>
                    Mark for Review
                  </button>
                  <button className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-white font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 transform active:scale-95">
                    Next
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-4 text-center text-slate-400 text-xs">
              Exam ID: #EX-2023-8842 &bull; Section: Data Structures
            </div>
          </div>
        </div>

        {/* Right: Sidebar Navigation */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 hidden lg:flex h-full">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary">grid_view</span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Question Palette</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Navigate to any question instantly</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <div className="grid grid-cols-5 gap-3">
              {/* Current Question */}
              <button className="aspect-square flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm shadow-md ring-2 ring-offset-2 ring-primary ring-offset-white dark:ring-offset-slate-900">1</button>

              {/* Answered Questions */}
              <button className="aspect-square flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium text-sm border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">2</button>
              <button className="aspect-square flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium text-sm border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">3</button>

              {/* Review Questions */}
              <button className="aspect-square flex items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium text-sm border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors relative">
                4
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              </button>

              {/* Unanswered Questions */}
              {[...Array(26)].map((_, i) => (
                <button key={i + 5} className="aspect-square flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  {i + 5}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-200 dark:bg-green-900 dark:border-green-800"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200 dark:bg-amber-900 dark:border-amber-800"></div>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"></div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary border border-primary"></div>
                <span>Current</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Floating Palette Toggle */}
        <button className="lg:hidden fixed bottom-6 right-6 h-12 w-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg flex items-center justify-center z-50">
          <span className="material-symbols-outlined">grid_view</span>
        </button>
      </main>
    </>
  );
}
