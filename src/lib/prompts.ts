const PROMPTS = [
  "Describe a sound from your childhood as if it were a person walking into the room.",
  "Write the opening paragraph of a novel that begins with a stranger returning a lost letter.",
  "What is something true that you've never said out loud? Write around it without saying it.",
  "Describe a city you've never been to using only weather and food.",
  "A character finds an old key in a coat pocket. Write the next 200 words.",
  "Write a love letter to an object you use every day.",
  "Describe yourself in the third person, ten years from now.",
  "Two strangers share an umbrella. They never speak. Write the scene.",
  "Write about light without using the word 'light'.",
  "What did you almost say today? Write it now.",
  "A door that has always been locked is open. Step through.",
  "Describe the last meal of a character about to leave forever.",
  "Write a memory that may not be entirely true.",
  "An apology that was never sent. Send it now.",
  "Describe the inside of a kitchen drawer as a self-portrait.",
];

export function getDailyPrompt(date = new Date()): string {
  const epoch = Math.floor(date.getTime() / 86400000);
  return PROMPTS[epoch % PROMPTS.length];
}
