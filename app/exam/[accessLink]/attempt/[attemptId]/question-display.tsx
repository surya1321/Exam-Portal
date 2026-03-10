"use client";

type QuestionDisplayProps = {
  question: {
    id: string;
    text: string;
    type: "mcq" | "true_false" | "fill_blank" | "essay";
    options: { id: string; text: string }[] | null;
    marks: number;
  };
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  questionNumber: number;
};

export function QuestionDisplay({
  question,
  selectedAnswer,
  onSelect,
  questionNumber,
}: QuestionDisplayProps) {
  if (question.type === "mcq") {
    return (
      <div className="flex flex-col gap-3 flex-1">
        <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
          {questionNumber}. {question.text}
        </h1>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {question.marks} {question.marks === 1 ? "mark" : "marks"}
        </div>
        <div className="flex flex-col gap-3">
          {question.options?.map((option) => (
            <label
              key={option.id}
              className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50"
            >
              <input
                checked={selectedAnswer === option.id}
                onChange={() => onSelect(option.id)}
                className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 accent-[var(--color-primary)]"
                name={`question_${question.id}`}
                type="radio"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">
                {option.text}
              </span>
              <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none" />
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "true_false") {
    const tfOptions = [
      { id: "True", text: "True" },
      { id: "False", text: "False" },
    ];
    return (
      <div className="flex flex-col gap-3 flex-1">
        <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
          {questionNumber}. {question.text}
        </h1>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {question.marks} {question.marks === 1 ? "mark" : "marks"}
        </div>
        <div className="flex flex-col gap-3">
          {tfOptions.map((option) => (
            <label
              key={option.id}
              className="group relative flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary/50 dark:hover:border-primary/50"
            >
              <input
                checked={selectedAnswer === option.id}
                onChange={() => onSelect(option.id)}
                className="peer h-5 w-5 border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 accent-[var(--color-primary)]"
                name={`question_${question.id}`}
                type="radio"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white peer-checked:text-slate-900 dark:peer-checked:text-white">
                {option.text}
              </span>
              <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary pointer-events-none" />
            </label>
          ))}
        </div>
      </div>
    );
  }

  // essay
  if (question.type === "essay") {
    return (
      <div className="flex flex-col gap-3 flex-1">
        <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
          {questionNumber}. {question.text}
        </h1>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {question.marks} {question.marks === 1 ? "mark" : "marks"}
        </div>
        <div className="mt-2">
          <textarea
            value={selectedAnswer || ""}
            onChange={(e) => onSelect(e.target.value)}
            placeholder="Write your essay answer here..."
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base leading-relaxed resize-y min-h-[200px]"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Write a detailed response. This question will be reviewed manually.
          </p>
        </div>
      </div>
    );
  }

  // fill_blank
  return (
    <div className="flex flex-col gap-3 flex-1">
      <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight mb-4">
        {questionNumber}. {question.text}
      </h1>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {question.marks} {question.marks === 1 ? "mark" : "marks"}
      </div>
      <div className="mt-2">
        <input
          type="text"
          value={selectedAnswer || ""}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
        />
      </div>
    </div>
  );
}
