export type DailyChallenge = {
  key: string;
  title: string;
  prompt: string;
  minWords: number;
};

const CHALLENGES: DailyChallenge[] = [
  { key: "monday-object", title: "Предмет на ладони", prompt: "Опишите вещь, которая лежит у вас под рукой, в 120 словах: цвет, вес, запах и одно воспоминание о ней.", minWords: 120 },
  { key: "tuesday-overheard", title: "Подслушанная фраза", prompt: "Начните текст с фразы, которую вы недавно услышали в чужом разговоре. Доведите сцену до неожиданного поворота.", minWords: 150 },
  { key: "wednesday-window", title: "Окно", prompt: "Посмотрите в окно ровно минуту. Запишите три детали, которых раньше не замечали, и сцену между двумя из них.", minWords: 100 },
  { key: "thursday-letter", title: "Письмо самому себе", prompt: "Напишите письмо себе пятилетней давности. Без советов — только то, что вы теперь видите ясно.", minWords: 180 },
  { key: "friday-dialog", title: "Один диалог", prompt: "Сцена из одного диалога: два героя, ни одного описания действий. Пусть напряжение проявится только в репликах.", minWords: 150 },
  { key: "saturday-walk", title: "Маршрут", prompt: "Опишите путь от двери до ближайшего перекрёстка как маленькое путешествие. Найдите в нём метафору.", minWords: 130 },
  { key: "sunday-memory", title: "Запах из детства", prompt: "Вспомните запах из детства и сцену, к которой он привязан. Без объяснений, только образы и движение.", minWords: 150 },
];

export function getTodayChallenge(date = new Date()): DailyChallenge {
  // Stable rotation by day-of-year so the same day always shows the same challenge
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

export const ALL_CHALLENGES = CHALLENGES;
