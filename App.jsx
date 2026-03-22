import { useMemo, useState } from 'react';

const toLocalISODate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
};

const INITIAL_FLASHCARDS = [
  {
    id: 1,
    english_phrase: "Ain't nothing but a heartache.",
    portuguese_translation: 'Nao e nada alem de magoa.',
    explanation:
      "Expressao comum em musica pop. 'Heartache' significa dor emocional, sofrimento amoroso.",
    next_review: shiftDays(0),
  },
  {
    id: 2,
    english_phrase: 'He was hiding in the bathroom.',
    portuguese_translation: 'Ele estava se escondendo no banheiro.',
    explanation:
      "Use 'was + verbo com -ing' para acoes em progresso no passado (past continuous).",
    next_review: shiftDays(0),
  },
  {
    id: 3,
    english_phrase: 'Chills!',
    portuguese_translation: 'Arrepiei! / Que arrepio!',
    explanation:
      "Interjeicao para quando algo emociona, impressiona ou causa arrepios.",
    next_review: shiftDays(0),
  },
  {
    id: 4,
    english_phrase: 'Yeah, I heard them.',
    portuguese_translation: 'Sim, eu os ouvi.',
    explanation:
      "'Heard' e passado de 'hear'. Use para algo que voce ouviu em um momento anterior.",
    next_review: shiftDays(0),
  },
  {
    id: 5,
    english_phrase: 'I love to sing along to songs in English.',
    portuguese_translation: 'Eu amo cantar junto com musicas em ingles.',
    explanation:
      "'Sing along' = cantar junto com a musica ou com outra pessoa.",
    next_review: shiftDays(1),
  },
  {
    id: 6,
    english_phrase: "It's raining cats and dogs.",
    portuguese_translation: 'Esta chovendo canivetes.',
    explanation:
      "Idiom: nao traduzir literalmente. Significa chuva muito forte.",
    next_review: shiftDays(-1),
  },
  {
    id: 7,
    english_phrase: 'Could you speak a little slower, please?',
    portuguese_translation: 'Voce poderia falar um pouco mais devagar, por favor?',
    explanation:
      "Frase util para conversacao. 'Could you...' soa mais educado que 'Can you...'.",
    next_review: shiftDays(0),
  },
  {
    id: 8,
    english_phrase: "I'm looking forward to your message.",
    portuguese_translation: 'Estou ansioso(a) pela sua mensagem.',
    explanation:
      "Depois de 'look forward to', use substantivo ou verbo com -ing.",
    next_review: shiftDays(2),
  },
];

export default function App() {
  const [cards] = useState(INITIAL_FLASHCARDS);
  const [screen, setScreen] = useState('dashboard');
  const [reviewQueue, setReviewQueue] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const today = toLocalISODate();

  const pendingToday = useMemo(
    () => cards.filter((card) => card.next_review <= today),
    [cards, today],
  );

  const currentCard = reviewQueue[0] || null;

  const startReview = () => {
    const queue = cards.filter((card) => card.next_review <= today);
    setReviewQueue(queue);
    setShowAnswer(false);
    setScreen(queue.length ? 'study' : 'done');
  };

  const goToDashboard = () => {
    setScreen('dashboard');
    setReviewQueue([]);
    setShowAnswer(false);
  };

  const handleRate = () => {
    setShowAnswer(false);

    setReviewQueue((prev) => {
      const next = prev.slice(1);
      if (!next.length) {
        setScreen('done');
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-4xl items-center justify-center">
        {screen === 'dashboard' && (
          <section className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg md:p-10">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Fluency + MemHack</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">Bem-vindo(a) ao seu treino diario de ingles</h1>
            <p className="mt-4 text-slate-600">Mantenha o ritmo: poucos minutos por dia, alta retencao com repeticao espacada.</p>

            <div className="mt-8 rounded-xl bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Cards pendentes para hoje</p>
              <p className="mt-1 text-4xl font-extrabold text-slate-900">{pendingToday.length}</p>
            </div>

            <button
              onClick={startReview}
              className="mt-8 w-full rounded-xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            >
              Comecar Revisao
            </button>
          </section>
        )}

        {screen === 'study' && currentCard && (
          <section className="w-full max-w-3xl">
            <div
              key={currentCard.id}
              className="rounded-2xl bg-white p-8 shadow-lg transition-opacity duration-300 md:p-12"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Card em estudo</p>
              <h2 className="mt-5 text-3xl font-bold leading-snug md:text-5xl">{currentCard.english_phrase}</h2>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showAnswer ? 'mt-7 max-h-80 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-xl font-semibold text-slate-700 md:text-2xl">{currentCard.portuguese_translation}</p>
                <p className="mt-3 text-base leading-relaxed text-slate-500 md:text-lg">{currentCard.explanation}</p>
              </div>
            </div>

            <div className="mt-6">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full rounded-xl bg-slate-900 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
                >
                  Mostrar Resposta
                </button>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleRate}
                    className="flex-1 rounded-xl bg-red-500 px-5 py-4 font-semibold text-white transition hover:bg-red-600 active:scale-[0.98]"
                  >
                    ?? Dificil
                  </button>
                  <button
                    onClick={handleRate}
                    className="flex-1 rounded-xl bg-amber-500 px-5 py-4 font-semibold text-white transition hover:bg-amber-600 active:scale-[0.98]"
                  >
                    ?? Bom
                  </button>
                  <button
                    onClick={handleRate}
                    className="flex-1 rounded-xl bg-green-500 px-5 py-4 font-semibold text-white transition hover:bg-green-600 active:scale-[0.98]"
                  >
                    ?? Facil
                  </button>
                </div>
              )}
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              Restantes na fila: <span className="font-semibold text-slate-700">{reviewQueue.length}</span>
            </p>
          </section>
        )}

        {screen === 'done' && (
          <section className="w-full max-w-2xl rounded-2xl bg-white p-10 text-center shadow-lg">
            <h2 className="text-3xl font-bold text-slate-900">Parabens! Revisao diaria concluida ??</h2>
            <p className="mt-3 text-slate-600">Excelente consistencia. Volte amanha para manter a curva de memoria a seu favor.</p>

            <button
              onClick={goToDashboard}
              className="mt-8 rounded-xl bg-slate-900 px-8 py-4 text-lg font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            >
              Voltar ao Dashboard
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
