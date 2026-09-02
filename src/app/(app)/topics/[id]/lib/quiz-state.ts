export interface QuizState {
  questionIndex: number;
  selectedOption: number | null;
  checked: boolean;
  score: number;
}

export function createQuizState(): QuizState {
  return { questionIndex: 0, selectedOption: null, checked: false, score: 0 };
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
  };
}

export function moveToNextQuestion(state: QuizState): QuizState {
  if (!state.checked) return state;
  return {
    questionIndex: state.questionIndex + 1,
    selectedOption: null,
    checked: false,
    score: state.score,
  };
}
