import { fetchFromAPI } from './api.js';

export class Quiz {
    constructor() {
        this.currentQuestion = null;
        this.score = 0;
        this.timer = null;
        this.timeLimit = 0;
        this.questionLimit = 0;
        this.questionsAnswered = 0;
        this.wrongAnswers = 0;
        this.difficulty = '';
    }

    async generateQuestion(subject) {
        if (this.questionLimit && this.questionsAnswered >= this.questionLimit) {
            return null;
        }

        const difficultyContext = this.getDifficultyContext();
        const prompt = `Generate a ${this.difficulty.toLowerCase()} level multiple choice question about ${subject}. ${difficultyContext}
            Format the response exactly as follows:
            {
                "question": "The question text here",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correctIndex": correct_option_index_here
            }`;

        try {
            const response = await fetchFromAPI(prompt);
            return JSON.parse(response);
        } catch (error) {
            return {
                question: 'Failed to load question. Please try again.',
                options: ['Error', 'Error', 'Error', 'Error'],
                correctIndex: 0
            };
        }
    }

    getDifficultyContext() {
        switch (this.difficulty) {
            case 'Easy':
                return 'Base the question on standard textbooks like BD Chaurasia, Guyton, Harper, etc.';
            case 'Medium':
                return 'Make it a NEET PG level question covering both clinical and non-clinical topics.';
            case 'Hard':
                return 'Make it an advanced NEET PG or INICET level clinical question.';
            default:
                return '';
        }
    }

    async getExplanation(question, options, correctIndex) {
        const prompt = `
        For this ${this.difficulty.toLowerCase()} level medical question and its options:
        Question: "${question}"
        Options: ${options.map((opt, i) => `${i + 1}. ${opt}`).join(', ')}
        Correct Answer: ${options[correctIndex]}

        Please provide a point-wise explanation in this exact format:
        CORRECT ANSWER (${options[correctIndex]}):
        • Point 1 about why it's correct
        • Point 2 about why it's correct

        WHY OTHER OPTIONS ARE INCORRECT:
        ${options.map((opt, i) => i !== correctIndex ? `${opt}:
        • Point 1 why it's wrong
        • Point 2 why it's wrong` : '').filter(Boolean).join('\n\n')}
        `;

        try {
            return await fetchFromAPI(prompt);
        } catch (error) {
            return 'Failed to load explanation.';
        }
    }

    async askDoubt(doubt, question) {
        const prompt = `
        Regarding this ${this.difficulty.toLowerCase()} level medical question:
        "${question}"
        
        User's doubt: "${doubt}"
        
        Please provide a clear, detailed explanation addressing this specific doubt in the context of the question.
        Focus on medical accuracy and explain in a way that's helpful for medical students.
        `;

        try {
            return await fetchFromAPI(prompt);
        } catch (error) {
            return 'Failed to get answer. Please try again.';
        }
    }

    getResults() {
        return {
            total: this.questionsAnswered,
            correct: this.score,
            wrong: this.wrongAnswers,
            percentage: this.questionsAnswered > 0 
                ? Math.round((this.score / this.questionsAnswered) * 100) 
                : 0
        };
    }
}