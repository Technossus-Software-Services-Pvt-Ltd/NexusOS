/* mockData.js — all fake content; never mutated in place */

export const mockUser = {
  name:           'Vaishnavi Ranaware',
  email:          'vaishnaviranaware07@gmail.com',
  avatarInitials: 'VR',
};

export const availableModels = [
  { id: 'mock-gpt-4o',      label: 'Mock GPT-4o',      description: 'High capability general model' },
  { id: 'mock-claude-3',    label: 'Mock Claude 3',    description: 'Nuanced and thoughtful responses' },
  { id: 'mock-gemini-pro',  label: 'Mock Gemini Pro',  description: 'Google\'s capable multimodal model' },
  { id: 'mock-llama-3',     label: 'Mock Llama 3',     description: 'Open-source local model' },
  { id: 'mock-mistral',     label: 'Mock Mistral',     description: 'Fast and efficient European model' },
];

export const defaultSettings = {
  theme:        'light',
  fontSize:     'medium',
  sendOnEnter:  true,
  soundEffects: false,
  showTimestamps: true,
  compactMode:  false,
};

export const welcomeSuggestions = [
  'Explain quantum computing in simple terms',
  'Write a short poem about the ocean at dawn',
  'What are the pros and cons of remote work?',
  'Help me debug a JavaScript async/await issue',
];

export const emptyStateMessages = {
  noChats:         { icon: '💬', text: 'No conversations yet. Start a new chat!' },
  noSearchResults: { icon: '🔍', text: 'No chats match your search.' },
  newChat:         { icon: '✨', text: 'Ask me anything to get started.' },
};

const now = Date.now();
const hour = 3600000;
const day  = 86400000;

export const starterChats = [
  {
    id: 'chat-001',
    title: 'React hooks and state management',
    model: 'mock-gpt-4o',
    createdAt:  new Date(now - 2 * hour).toISOString(),
    updatedAt:  new Date(now - 2 * hour).toISOString(),
    messages: [
      {
        id: 'msg-001-1',
        role: 'user',
        text: 'Can you explain the difference between useState and useReducer in React?',
        timestamp: new Date(now - 2 * hour).toISOString(),
      },
      {
        id: 'msg-001-2',
        role: 'assistant',
        text: 'Great question! Both `useState` and `useReducer` are React hooks for managing state, but they shine in different situations.\n\n**useState** is the simpler option. It\'s ideal when you have a single piece of state or a few independent state variables. Under the hood it just holds a value and gives you a setter function.\n\n**useReducer** follows the Redux pattern — you dispatch action objects, and a pure reducer function decides how state transitions. It\'s a better fit when:\n• Your state logic is complex with many sub-values\n• The next state depends on the previous one in non-trivial ways\n• You want predictable state transitions that are easy to test in isolation\n\nA good rule of thumb: start with `useState`, and reach for `useReducer` when you find yourself writing multiple `useState` calls that need to change together, or when your state update logic is getting hard to follow.',
        timestamp: new Date(now - 2 * hour + 1500).toISOString(),
      },
      {
        id: 'msg-001-3',
        role: 'user',
        text: 'Could you show me a quick example of useReducer for a counter?',
        timestamp: new Date(now - 1.9 * hour).toISOString(),
      },
      {
        id: 'msg-001-4',
        role: 'assistant',
        text: 'Sure! Here\'s a minimal counter with `useReducer`:\n\n```js\nconst initialState = { count: 0 };\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    case "increment": return { count: state.count + 1 };\n    case "decrement": return { count: state.count - 1 };\n    case "reset":     return initialState;\n    default: throw new Error("Unknown action: " + action.type);\n  }\n}\n\nfunction Counter() {\n  const [state, dispatch] = useReducer(reducer, initialState);\n  return (\n    <div>\n      <p>Count: {state.count}</p>\n      <button onClick={() => dispatch({ type: "increment" })}>+</button>\n      <button onClick={() => dispatch({ type: "decrement" })}>−</button>\n      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>\n    </div>\n  );\n}\n```\n\nThe key insight is that `dispatch` is stable across renders (no need to wrap in `useCallback`), which makes it easy to pass down to children without causing unnecessary re-renders.',
        timestamp: new Date(now - 1.88 * hour).toISOString(),
      },
    ],
  },
  {
    id: 'chat-002',
    title: 'Planning a trip to Japan',
    model: 'mock-claude-3',
    createdAt:  new Date(now - day - 3 * hour).toISOString(),
    updatedAt:  new Date(now - day - 3 * hour).toISOString(),
    messages: [
      {
        id: 'msg-002-1',
        role: 'user',
        text: 'I want to visit Japan for two weeks in October. What cities should I prioritize?',
        timestamp: new Date(now - day - 3 * hour).toISOString(),
      },
      {
        id: 'msg-002-2',
        role: 'assistant',
        text: 'October is a wonderful time to visit Japan — the autumn foliage (koyo) is breathtaking and the weather is mild. For two weeks I\'d suggest a classic but deeply rewarding route:\n\n**Week 1 — Tokyo (4–5 nights)**\nUse Tokyo as your base to explore neighborhoods like Shinjuku, Shibuya, Harajuku, Akihabara, and the historic Asakusa district. Day-trip options include Nikko, Kamakura, or even a quick visit to Mt. Fuji\'s Fuji Five Lakes area.\n\n**Transition — Hakone (1–2 nights)**\nA great stop between Tokyo and Kyoto. Famous for its onsen (hot springs) and clear-day views of Mt. Fuji. Take the Romancecar from Shinjuku.\n\n**Week 2 — Kyoto (3–4 nights) + Osaka (1–2 nights)**\nKyoto is Japan\'s cultural heart — temples, bamboo groves, geisha districts, and garden-lined rivers. Osaka is livelier, with incredible street food (takoyaki, okonomiyaki) and a vibrant nightlife scene. The two cities are only 15 minutes apart by shinkansen.\n\n**Optional add-on:** If you have time, Hiroshima and the island of Miyajima make for a powerful and beautiful day trip from Osaka or Kyoto.\n\nWould you like specific neighborhood breakdowns, food recommendations, or a rough day-by-day itinerary?',
        timestamp: new Date(now - day - 3 * hour + 2000).toISOString(),
      },
    ],
  },
  {
    id: 'chat-003',
    title: 'Healthy meal prep ideas for the week',
    model: 'mock-gpt-4o',
    createdAt:  new Date(now - 3 * day).toISOString(),
    updatedAt:  new Date(now - 3 * day).toISOString(),
    messages: [
      {
        id: 'msg-003-1',
        role: 'user',
        text: 'I need simple, healthy meal prep ideas for a busy work week. I eat mostly vegetarian.',
        timestamp: new Date(now - 3 * day).toISOString(),
      },
      {
        id: 'msg-003-2',
        role: 'assistant',
        text: 'Here are five batch-prep meals that are nutritious, filling, and easy to portion for the week:\n\n1. **Quinoa Buddha Bowls** — Cook a big batch of quinoa on Sunday. Pair with roasted chickpeas, steamed broccoli, sliced avocado, and a tahini-lemon drizzle. Keeps well for 4 days.\n\n2. **Red Lentil Dal** — A one-pot wonder. Simmer red lentils with tomatoes, coconut milk, ginger, and garam masala. Serve over brown rice. Freezes perfectly.\n\n3. **Black Bean & Sweet Potato Burritos** — Roast sweet potato cubes, mix with canned black beans (seasoned with cumin and smoked paprika), and wrap in whole-wheat tortillas. Wrap individually in foil; reheat straight from the fridge.\n\n4. **Greek Pasta Salad** — Whole-wheat penne, cherry tomatoes, cucumber, Kalamata olives, red onion, feta, and a simple red wine vinegar + olive oil dressing. Best eaten at room temp.\n\n5. **Overnight Oats × 5** — Set up 5 mason jars: 1/2 cup rolled oats + 3/4 cup oat milk + chia seeds + a pinch of salt. Add different toppings per jar (banana + PB, berries + honey, apple + cinnamon, mango + coconut, mixed nuts + maple).\n\n**Shopping tip:** Build your list around 3–4 core proteins (lentils, chickpeas, eggs, tofu) and 2–3 grains, then rotate vegetables based on what\'s in season and on sale.',
        timestamp: new Date(now - 3 * day + 1800).toISOString(),
      },
    ],
  },
  {
    id: 'chat-004',
    title: 'Writing a cover letter for a UX role',
    model: 'mock-claude-3',
    createdAt:  new Date(now - 6 * day).toISOString(),
    updatedAt:  new Date(now - 6 * day).toISOString(),
    messages: [
      {
        id: 'msg-004-1',
        role: 'user',
        text: 'Can you help me write a cover letter? I\'m applying for a senior UX designer position at a mid-sized fintech startup.',
        timestamp: new Date(now - 6 * day).toISOString(),
      },
      {
        id: 'msg-004-2',
        role: 'assistant',
        text: 'Happy to help! To write a compelling cover letter I\'ll need a few details from you:\n\n1. **Your experience level** — roughly how many years have you been in UX? Any specific industries?\n2. **Your strongest 2–3 wins** — measurable outcomes (e.g., "reduced onboarding drop-off by 30%", "shipped redesign of X feature used by Y users")\n3. **Why this company specifically** — any public product, blog post, or design decision you genuinely admire? Personalisation is the single biggest differentiator in cover letters.\n4. **The job description keywords** — share the key skills/tools they listed and I\'ll mirror their language naturally.\n5. **Tone preference** — polished & formal, warm & conversational, or confident & punchy?\n\nOnce I have those I can draft something tailored rather than generic.',
        timestamp: new Date(now - 6 * day + 1200).toISOString(),
      },
    ],
  },
];

export const mockReplies = [
  "That's a thoughtful question. Let me break it down for you.\n\nThe key thing to understand here is that there are multiple layers to consider. First, the immediate practical aspect — what you can do right now. Second, the broader context that shapes the best approach long-term.\n\nIn practice, most people find that starting with the simplest solution and iterating works better than trying to design the perfect system upfront. What would you like to explore further?",

  "Great point! This comes up often and there are a few ways to look at it.\n\nOn one hand, the conventional wisdom says to keep things simple and avoid premature optimisation. On the other hand, some foundational decisions are genuinely hard to change later, so a bit of upfront thinking pays dividends.\n\nMy recommendation: write the simplest thing that could possibly work, add good tests around it, and let real usage tell you where to invest further. Does that direction make sense for your situation?",

  "I can help with that. Here's a structured way to think about it:\n\n**Step 1 — Define the goal clearly.** What does success look like? Being specific here prevents wasted effort later.\n\n**Step 2 — Identify constraints.** Time, budget, skill, tooling — constraints shape the solution space.\n\n**Step 3 — Generate options.** Don't settle on the first idea. Come up with at least three approaches and compare them honestly.\n\n**Step 4 — Decide and act.** Pick the option that best fits your constraints and move forward. Adjust as you learn more.\n\nWould you like help working through any of these steps for your specific case?",

  "Interesting! I see a few angles here worth exploring.\n\nThe short answer is: it depends on what you're optimising for. If you prioritise speed, approach A is likely better. If you need long-term maintainability, approach B gives you more room to grow.\n\nA useful exercise: imagine yourself six months from now inheriting this codebase with no memory of building it. Which version would you rather find? That often clarifies the decision quickly.",

  "Sure, here's a concise explanation:\n\nAt its core, the concept is about separating *what* you want to happen from *how* it happens. This is a pattern you'll see repeatedly in well-designed systems — it makes things easier to change, test, and reason about independently.\n\nA good analogy: when you use a TV remote, you press 'volume up' without caring whether the TV uses a speaker motor or digital amplifier internally. The abstraction lets you interact without understanding the implementation. Same principle applies here.\n\nWhat part would you like to dig deeper into?",

  "Absolutely. Let me give you the key points without unnecessary jargon:\n\n1. The fundamental idea is straightforward once you see it.\n2. The most common mistake is overthinking the setup before you have real data to guide you.\n3. The best way to learn it is to build something small end-to-end — theory only gets you so far.\n\nIf you share what you're working on specifically, I can tailor this to something more concrete and actionable.",

  "That's a common pain point! Here are the most effective approaches I've seen:\n\n• **Reproduce it reliably first.** You can't fix what you can't reliably trigger. Spend time crafting a minimal reproduction case.\n• **Binary search the problem space.** Comment out half the code/config; is it still broken? Narrow until the culprit is obvious.\n• **Read the error message literally.** Error messages often tell you exactly what's wrong but in unfamiliar phrasing — translate it into plain language.\n• **Check recent changes.** `git diff` or `git log --oneline -10` often reveals the change that introduced the regression.\n\nWhich of these have you already tried?",

  "Happy to help you think through this.\n\nThe most important thing I'd flag is that this decision has downstream consequences that aren't obvious until later — specifically around [the topic you've raised]. Teams that skip careful consideration here often spend significant time backtracking.\n\nThat said, perfect is the enemy of good. If you need to move fast, pick a reasonable default, document the reasoning, and set a calendar reminder to revisit in 30 days once you have real usage data.\n\nWhat's your timeline pressure like?",
];

export const greetingReplies = [
  "Hello! I'm your AI assistant. I'm ready to help with coding, writing, research, brainstorming, or just about anything else you have in mind. What can I help you with today?",
  "Hi there! Great to meet you. I'm here to help — whether you need to work through a technical problem, draft some text, or explore an idea. What's on your mind?",
  "Hey! Ready when you are. Feel free to ask me anything — I'll do my best to give you clear, useful answers. What would you like to explore?",
];

export const thankYouReplies = [
  "You're very welcome! Don't hesitate to come back if you have more questions.",
  "Happy to help! Feel free to ask if there's anything else on your mind.",
  "Glad I could assist! Let me know whenever you need anything else.",
];
