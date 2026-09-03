export interface QuizState {
  questionIndex: number;
  selectedOption: number | null;
  checked: boolean;
  score: number;
  /**
   * The option chosen for each question already checked, in question order. The
   * running `score` drives the display; this is what gets sent when the run
   * ends, so the recorded score is graded from the answers rather than asserted
   * by the browser.
   */
  answers: number[];
}

export function createQuizState(): QuizState {
  return { questionIndex: 0, selectedOption: null, checked: false, score: 0, answers: [] };
}

export function selectQuizOption(state: QuizState, optionIndex: number): QuizState {
  if (state.checked) return state;
  return { ...state, selectedOption: optionIndex };
}

export function checkCurrentAnswer(state: QuizState, correctIndex: number): QuizState {
  if (state.checked || state.selectedOption === null) return state;
  return {
    ...state,
    checked: true,
    score: state.score + (state.selectedOption === correctIndex ? 1 : 0),
    answers: [...state.answers, state.selectedOption],
  };
}

export function moveToNextQuestion(state: QuizState): QuizState {
  if (!state.checked) return state;
  return {
    questionIndex: state.questionIndex + 1,
    selectedOption: null,
    checked: false,
    score: state.score,
    answers: state.answers,
  };
}

export function isQuizComplete(state: QuizState, questionCount: number): boolean {
  return state.questionIndex >= questionCount;
}
