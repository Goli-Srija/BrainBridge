// Verbal ability: word-bank generated synonym/antonym/vocabulary questions, template-generated
// voice and narration questions, and hand-written grammar / comprehension questions.
const { pick, shuffle, generateTopic, handwritten } = require('./lib');

// [word, meaning, synonym, antonym, level]
const WB = [
  ['Abundant', 'existing in large quantities', 'Plentiful', 'Scarce', 'easy'], ['Benevolent', 'kind and generous', 'Charitable', 'Malevolent', 'medium'],
  ['Candid', 'truthful and straightforward', 'Frank', 'Evasive', 'medium'], ['Diligent', 'showing care and effort in work', 'Hardworking', 'Lazy', 'easy'],
  ['Eloquent', 'fluent and persuasive in speaking', 'Articulate', 'Inarticulate', 'medium'], ['Frugal', 'careful with money', 'Thrifty', 'Extravagant', 'medium'],
  ['Gregarious', 'fond of company; sociable', 'Sociable', 'Reclusive', 'hard'], ['Hostile', 'unfriendly; antagonistic', 'Aggressive', 'Friendly', 'easy'],
  ['Immense', 'extremely large', 'Enormous', 'Tiny', 'easy'], ['Jubilant', 'feeling great joy', 'Elated', 'Dejected', 'medium'],
  ['Lucid', 'clearly expressed; easy to understand', 'Clear', 'Obscure', 'medium'], ['Meticulous', 'showing great attention to detail', 'Thorough', 'Careless', 'medium'],
  ['Novice', 'a person new to an activity', 'Beginner', 'Expert', 'easy'], ['Obsolete', 'no longer in use', 'Outdated', 'Modern', 'easy'],
  ['Pragmatic', 'dealing with things practically', 'Practical', 'Idealistic', 'hard'], ['Prudent', 'acting with care for the future', 'Wise', 'Reckless', 'medium'],
  ['Resilient', 'able to recover quickly from difficulty', 'Tough', 'Fragile', 'medium'], ['Scrutinize', 'examine closely', 'Inspect', 'Overlook', 'medium'],
  ['Tenacious', 'holding firmly to a purpose', 'Persistent', 'Irresolute', 'hard'], ['Ubiquitous', 'present everywhere', 'Omnipresent', 'Rare', 'hard'],
  ['Vivid', 'producing strong, clear images', 'Bright', 'Dull', 'easy'], ['Zealous', 'full of energy and enthusiasm', 'Eager', 'Apathetic', 'hard'],
  ['Ambiguous', 'open to more than one interpretation', 'Unclear', 'Explicit', 'medium'], ['Brevity', 'concise use of words', 'Conciseness', 'Verbosity', 'hard'],
  ['Cordial', 'warm and friendly', 'Amiable', 'Unfriendly', 'easy'], ['Deter', 'discourage from acting', 'Discourage', 'Encourage', 'medium'],
  ['Enhance', 'improve the quality of', 'Improve', 'Diminish', 'easy'], ['Feasible', 'possible and practical to do', 'Viable', 'Impossible', 'medium'],
  ['Genuine', 'truly what it is said to be', 'Authentic', 'Fake', 'easy'], ['Hinder', 'create difficulties for', 'Obstruct', 'Facilitate', 'medium'],
  ['Impartial', 'treating all equally', 'Unbiased', 'Biased', 'medium'], ['Lethargic', 'sluggish and without energy', 'Sluggish', 'Energetic', 'hard'],
  ['Mitigate', 'make less severe', 'Alleviate', 'Aggravate', 'hard'], ['Negligent', 'failing to take proper care', 'Careless', 'Attentive', 'medium'],
  ['Optimistic', 'hopeful about the future', 'Hopeful', 'Pessimistic', 'easy'], ['Placid', 'calm and peaceful', 'Calm', 'Agitated', 'hard'],
  ['Profound', 'very great or intense; deep', 'Deep', 'Superficial', 'medium'], ['Reluctant', 'unwilling and hesitant', 'Unwilling', 'Eager', 'easy'],
  ['Sincere', 'free from pretence', 'Honest', 'Insincere', 'easy'], ['Trivial', 'of little importance', 'Insignificant', 'Crucial', 'medium'],
  ['Vacant', 'not occupied; empty', 'Empty', 'Occupied', 'easy'], ['Verbose', 'using more words than needed', 'Wordy', 'Concise', 'hard'],
  ['Adversity', 'difficulty or misfortune', 'Hardship', 'Prosperity', 'medium'], ['Commence', 'begin', 'Start', 'Conclude', 'easy'],
  ['Compassion', 'sympathetic concern for others', 'Empathy', 'Indifference', 'medium'], ['Conceal', 'keep hidden', 'Hide', 'Reveal', 'easy'],
  ['Consensus', 'general agreement', 'Agreement', 'Disagreement', 'medium'], ['Dormant', 'temporarily inactive', 'Inactive', 'Active', 'medium'],
  ['Elusive', 'difficult to find or catch', 'Evasive', 'Accessible', 'hard'], ['Exemplary', 'serving as a desirable model', 'Ideal', 'Deplorable', 'hard'],
  ['Fragile', 'easily broken', 'Delicate', 'Sturdy', 'easy'], ['Futile', 'incapable of producing results', 'Useless', 'Fruitful', 'medium'],
  ['Haughty', 'arrogantly superior', 'Arrogant', 'Humble', 'medium'], ['Inevitable', 'certain to happen', 'Unavoidable', 'Avoidable', 'medium'],
  ['Lenient', 'merciful or tolerant', 'Tolerant', 'Strict', 'medium'], ['Mundane', 'lacking interest; ordinary', 'Ordinary', 'Extraordinary', 'hard'],
  ['Notorious', 'famous for something bad', 'Infamous', 'Reputable', 'hard'], ['Ostentatious', 'designed to impress; showy', 'Showy', 'Modest', 'hard'],
  ['Perilous', 'full of danger', 'Dangerous', 'Safe', 'medium'], ['Rigid', 'unable to bend; inflexible', 'Inflexible', 'Flexible', 'easy'],
  ['Serene', 'calm and untroubled', 'Tranquil', 'Turbulent', 'medium'], ['Spontaneous', 'done without planning', 'Impulsive', 'Planned', 'medium'],
  ['Superfluous', 'more than needed', 'Excessive', 'Essential', 'hard'], ['Transparent', 'easy to see through or understand', 'Clear', 'Opaque', 'easy'],
  ['Vigilant', 'keeping careful watch', 'Watchful', 'Careless', 'medium'], ['Wane', 'decrease gradually', 'Decline', 'Wax', 'hard'],
  ['Affluent', 'having a lot of money', 'Wealthy', 'Poor', 'easy'], ['Concur', 'agree', 'Agree', 'Differ', 'medium'],
  ['Arduous', 'involving great effort', 'Strenuous', 'Effortless', 'hard'], ['Candour', 'quality of being open and honest', 'Openness', 'Deceit', 'hard'],
];

const byLevel = (lvl) => WB.filter((w) => w[4] === lvl);
const wordQ = (kind) => (lvl) => (r) => {
  const w = pick(r, byLevel(lvl));
  const others = shuffle(r, WB.filter((x) => x[0] !== w[0]));
  if (kind === 'syn') return { q: `Choose the word most similar in meaning to "${w[0].toUpperCase()}".`, a: w[2], d: [w[3], ...others.slice(0, 3).map((x) => x[2])], e: `${w[0]} means "${w[1]}". Synonym: ${w[2]}. (${w[3]} is the opposite.)` };
  if (kind === 'ant') return { q: `Choose the word most opposite in meaning to "${w[0].toUpperCase()}".`, a: w[3], d: [w[2], ...others.slice(0, 3).map((x) => x[3])], e: `${w[0]} means "${w[1]}". Antonym: ${w[3]}.` };
  return { q: `What is the meaning of the word "${w[0]}"?`, a: w[1], d: others.slice(0, 4).map((x) => x[1]), e: `${w[0]}: ${w[1]} (e.g. synonym ${w[2]}, antonym ${w[3]}).` };
};
const wordGens = (kind) => ({ easy: [wordQ(kind)('easy')], medium: [wordQ(kind)('medium')], hard: [wordQ(kind)('hard')] });

// ----- active / passive voice -----
const SVO = [
  ['The chef', 'the meal', ['cooks', 'cooked', 'is cooking', 'has cooked', 'will cook'], 'cooked'], ['Riya', 'a letter', ['writes', 'wrote', 'is writing', 'has written', 'will write'], 'written'],
  ['The teacher', 'the papers', ['checks', 'checked', 'is checking', 'has checked', 'will check'], 'checked'], ['The company', 'new engineers', ['hires', 'hired', 'is hiring', 'has hired', 'will hire'], 'hired'],
  ['Arjun', 'the project', ['completes', 'completed', 'is completing', 'has completed', 'will complete'], 'completed'], ['The police', 'the thief', ['catch', 'caught', 'are catching', 'have caught', 'will catch'], 'caught'],
  ['The students', 'the experiment', ['perform', 'performed', 'are performing', 'have performed', 'will perform'], 'performed'], ['My mother', 'the cake', ['bakes', 'baked', 'is baking', 'has baked', 'will bake'], 'baked'],
  ['The manager', 'the report', ['approves', 'approved', 'is approving', 'has approved', 'will approve'], 'approved'], ['Kiran', 'the song', ['sings', 'sang', 'is singing', 'has sung', 'will sing'], 'sung'],
  ['The developer', 'the bug', ['fixes', 'fixed', 'is fixing', 'has fixed', 'will fix'], 'fixed'], ['The gardener', 'the plants', ['waters', 'watered', 'is watering', 'has watered', 'will water'], 'watered'],
];
const OBJ = { 'The chef': 'the chef', Riya: 'Riya', 'The teacher': 'the teacher', 'The company': 'the company', Arjun: 'Arjun', 'The police': 'the police', 'The students': 'the students', 'My mother': 'my mother', 'The manager': 'the manager', Kiran: 'Kiran', 'The developer': 'the developer', 'The gardener': 'the gardener' };
const plural = (o) => /s$/.test(o.replace(/the /, '')) && !/papers?$/.test('') ? true : false;
function passive(o, ti, pp) {
  const pl = /(engineers|papers|plants|thief$)/.test(o) ? /(engineers|papers|plants)/.test(o) : false;
  const be = [pl ? 'are' : 'is', pl ? 'were' : 'was', pl ? 'are being' : 'is being', pl ? 'have been' : 'has been', 'will be'][ti];
  return { be, pl };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const voiceGen = (tenses) => (r) => {
  const [s, o, forms, pp] = pick(r, SVO); const ti = pick(r, tenses);
  const { be } = passive(o, ti, pp);
  const ans = `${cap(o)} ${be} ${pp} by ${OBJ[s]}.`;
  const wrong = [0, 1, 2, 3, 4].filter((k) => k !== ti).map((k) => `${cap(o)} ${passive(o, k, pp).be} ${pp} by ${OBJ[s]}.`);
  void plural;
  return { q: `Change into passive voice: "${s} ${forms[ti]} ${o}."`, a: ans, d: shuffle(r, wrong), e: `${['Simple present', 'Simple past', 'Present continuous', 'Present perfect', 'Simple future'][ti]} active → passive uses "${be} + past participle (${pp})". Object becomes subject: ${ans}` };
};

// ----- direct / indirect speech -----
const DI = [
  ['He said, "I am tired."', 'He said that he was tired.', ['He said that I am tired.', 'He said that he is tired.', 'He said that he had been tired.']],
  ['She said, "I like coding."', 'She said that she liked coding.', ['She said that I like coding.', 'She said that she likes coding.', 'She said that she had liked coding.']],
  ['Ravi said, "I will finish the project."', 'Ravi said that he would finish the project.', ['Ravi said that he will finish the project.', 'Ravi said that I would finish the project.', 'Ravi said that he would have finished the project.']],
  ['Meena said, "I have completed the assignment."', 'Meena said that she had completed the assignment.', ['Meena said that she has completed the assignment.', 'Meena said that she completed the assignment.', 'Meena said that I had completed the assignment.']],
  ['The teacher said, "The earth revolves around the sun."', 'The teacher said that the earth revolves around the sun.', ['The teacher said that the earth revolved around the sun.', 'The teacher said that the earth had revolved around the sun.', 'The teacher said that the earth is revolving around the sun.']],
  ['He said to me, "Where do you live?"', 'He asked me where I lived.', ['He asked me where do you live.', 'He said to me where I live.', 'He asked me where did I live.']],
  ['She said to him, "Are you coming?"', 'She asked him if he was coming.', ['She asked him are you coming.', 'She asked him if he is coming.', 'She said to him that he was coming.']],
  ['The manager said, "Submit the report today."', 'The manager ordered to submit the report that day.', ['The manager said to submit the report today.', 'The manager ordered that submit the report today.', 'The manager ordered to submitted the report that day.']],
  ['Arjun said, "I was reading a book."', 'Arjun said that he had been reading a book.', ['Arjun said that he was reading a book.', 'Arjun said that I had been reading a book.', 'Arjun said that he has been reading a book.']],
  ['She said, "I can solve this problem."', 'She said that she could solve this problem.', ['She said that she can solve that problem.', 'She said that she could solve that problem.', 'She said that I could solve that problem.']],
  ['He said, "Please help me."', 'He requested to help him.', ['He requested to help me.', 'He said to please help him.', 'He ordered to help him.']],
  ['They said, "We are going to Delhi tomorrow."', 'They said that they were going to Delhi the next day.', ['They said that they are going to Delhi tomorrow.', 'They said that we were going to Delhi the next day.', 'They said that they had gone to Delhi the next day.']],
  ['The boy said, "I bought a new phone yesterday."', 'The boy said that he had bought a new phone the previous day.', ['The boy said that he bought a new phone yesterday.', 'The boy said that I had bought a new phone the previous day.', 'The boy said that he has bought a new phone the previous day.']],
  ['Priya said to Anil, "Did you attend the meeting?"', 'Priya asked Anil if he had attended the meeting.', ['Priya asked Anil did he attend the meeting.', 'Priya asked Anil if he attended the meeting.', 'Priya said to Anil that he had attended the meeting.']],
  ['He said, "What a beautiful view!"', 'He exclaimed that it was a very beautiful view.', ['He said what a beautiful view it is.', 'He exclaimed that what a beautiful view.', 'He asked that it was a beautiful view.']],
  ['The doctor said to the patient, "Take rest for two days."', 'The doctor advised the patient to take rest for two days.', ['The doctor said the patient take rest for two days.', 'The doctor advised the patient that take rest for two days.', 'The doctor ordered the patient took rest for two days.']],
];
// One correct sentence needs a fix: "this problem" must become "that problem" in reported speech.
DI[9] = ['She said, "I can solve this problem."', 'She said that she could solve that problem.', ['She said that she can solve this problem.', 'She said that she could solve this problem.', 'She said that I could solve that problem.']];

const HW = {
  grammar: [
    ['Choose the correct sentence.', ['She does not like coffee.', 'She do not like coffee.', 'She does not likes coffee.', 'She not like coffee.'], 0, 'Third-person singular uses "does not + base verb".', 'easy'],
    ['Each of the students ___ a laptop.', ['has', 'have', 'are having', 'were having'], 0, '"Each" is singular, so it takes "has".', 'easy'],
    ['Neither the manager nor the employees ___ present.', ['were', 'was', 'is', 'has been'], 0, 'With neither/nor, the verb agrees with the nearer subject ("employees" → were).', 'medium'],
    ['I have been working here ___ 2021.', ['since', 'for', 'from', 'by'], 0, '"Since" is used with a point in time.', 'easy'],
    ['If I ___ you, I would accept the offer.', ['were', 'was', 'am', 'will be'], 0, 'Hypothetical conditions use the subjunctive "were".', 'medium'],
    ['The number of applicants ___ increasing every year.', ['is', 'are', 'were', 'have been'], 0, '"The number of" takes a singular verb.', 'medium'],
    ['He is ___ honest man.', ['an', 'a', 'the', 'no article'], 0, '"Honest" begins with a vowel sound, so "an".', 'easy'],
    ['By the time we reached the station, the train ___.', ['had left', 'has left', 'left', 'was leaving'], 0, 'An action completed before another past action → past perfect.', 'medium'],
    ['She is one of the best developers who ___ worked here.', ['have', 'has', 'is', 'was'], 0, '"Who" refers to "developers" (plural) → have.', 'hard'],
    ['Choose the correctly punctuated sentence.', ['However, the results were not satisfactory.', 'However the results, were not satisfactory.', 'However; the results were not satisfactory.', 'However the results were not, satisfactory.'], 0, 'An introductory adverb is followed by a comma.', 'medium'],
    ['Hardly had he entered the room ___ the phone rang.', ['when', 'than', 'then', 'that'], 0, '"Hardly ... when" is the correct pairing.', 'hard'],
    ['The data ___ been analysed by the team.', ['has', 'have been', 'are', 'is being'], 0, 'In modern usage "data" is commonly treated as singular: "The data has been analysed".', 'hard'],
    ['Choose the correct comparative: This algorithm is ___ than the previous one.', ['more efficient', 'most efficient', 'efficienter', 'more efficienter'], 0, 'Long adjectives use "more" for the comparative.', 'easy'],
    ['One of my friends ___ in Bangalore.', ['lives', 'live', 'are living', 'have lived'], 0, '"One" is the subject → singular verb.', 'easy'],
    ['We look forward to ___ from you.', ['hearing', 'hear', 'heard', 'be hearing'], 0, '"Look forward to" is followed by a gerund (-ing).', 'medium'],
    ['Scarcely ___ the meeting started when the power went off.', ['had', 'has', 'did', 'was'], 0, 'Inversion with "scarcely" uses past perfect: Scarcely had ...', 'hard'],
  ],
  'sentence-correction': [
    ['Choose the correct version: "He did not knew the answer."', ['He did not know the answer.', 'He did not knew answer.', 'He does not knew the answer.', 'He not knew the answer.'], 0, 'After "did not", use the base verb (know).', 'easy'],
    ['Choose the correct version: "The team have won their match."', ['The team has won its match.', 'The team have won its match.', 'The team has won their matches.', 'The teams has won its match.'], 0, 'In formal Indian/British exam usage, the collective noun acting as one unit takes a singular verb and pronoun.', 'medium'],
    ['Choose the correct version: "I am working in this company since two years."', ['I have been working in this company for two years.', 'I am working in this company for two years.', 'I have been working in this company since two years.', 'I worked in this company since two years.'], 0, 'Duration up to now → present perfect continuous with "for".', 'medium'],
    ['Choose the correct version: "Myself Rahul, I am from Pune."', ['I am Rahul, from Pune.', 'Myself is Rahul from Pune.', 'Me Rahul, from Pune.', 'Myself am Rahul from Pune.'], 0, '"Myself" is a reflexive pronoun and cannot be the subject. Use "I am ...".', 'easy'],
    ['Choose the correct version: "Please revert back to me."', ['Please reply to me.', 'Please revert back me.', 'Please revert to back me.', 'Please reverted back to me.'], 0, '"Revert back" is redundant; in professional English, "reply" or "get back to me" is clearer.', 'medium'],
    ['Choose the correct version: "She is more smarter than her brother."', ['She is smarter than her brother.', 'She is most smarter than her brother.', 'She is more smart than her brother.', 'She is smartest than her brother.'], 0, 'Avoid double comparatives.', 'easy'],
    ['Choose the correct version: "Despite of the rain, we went out."', ['Despite the rain, we went out.', 'Inspite the rain, we went out.', 'Despite of rain, we went out.', 'In spite the rain, we went out.'], 0, '"Despite" is never followed by "of" (but "in spite of" is correct).', 'medium'],
    ['Choose the correct version: "Each of the employees have submitted their report."', ['Each of the employees has submitted a report.', 'Each of the employees have submitted reports.', 'Each employees has submitted their report.', 'Each of employee has submitted a report.'], 0, '"Each" takes a singular verb.', 'hard'],
    ['Choose the correct version: "I prefer tea than coffee."', ['I prefer tea to coffee.', 'I prefer tea over than coffee.', 'I prefer tea from coffee.', 'I am preferring tea than coffee.'], 0, '"Prefer" is followed by "to".', 'medium'],
    ['Choose the correct version: "He gave me an advice."', ['He gave me some advice.', 'He gave me advices.', 'He gave me a advice.', 'He gave me the advices.'], 0, '"Advice" is uncountable.', 'easy'],
    ['Choose the correct version: "The informations you gave are useful."', ['The information you gave is useful.', 'The informations you gave is useful.', 'The information you gave are useful.', 'An information you gave is useful.'], 0, '"Information" is uncountable and singular.', 'easy'],
    ['Choose the correct version: "No sooner did he arrive than the meeting started."', ['No sooner did he arrive than the meeting started.', 'No sooner he arrived than the meeting started.', 'No sooner did he arrive when the meeting started.', 'No sooner did he arrived than the meeting started.'], 0, 'The original is already correct: "No sooner ... than" with inversion.', 'hard'],
    ['Choose the correct version: "Between you and I, the plan will fail."', ['Between you and me, the plan will fail.', 'Between you and myself, the plan will fail.', 'Among you and I, the plan will fail.', 'Between yourself and I, the plan will fail.'], 0, 'Prepositions take object pronouns (me).', 'hard'],
  ],
  'error-detection': [
    ['Find the part with an error: (A) The list of items / (B) are on the desk / (C) near the window / (D) No error', ['B', 'A', 'C', 'D'], 0, 'Subject is "list" (singular) → "is on the desk".', 'medium'],
    ['Find the part with an error: (A) She has / (B) completed her work / (C) yesterday evening. / (D) No error', ['A', 'B', 'C', 'D'], 0, 'With a specific past time (yesterday), use simple past: "She completed".', 'medium'],
    ['Find the part with an error: (A) He is / (B) senior than me / (C) in the office. / (D) No error', ['B', 'A', 'C', 'D'], 0, '"Senior" takes "to": senior to me.', 'easy'],
    ['Find the part with an error: (A) Neither of the two answers / (B) are correct / (C) according to the key. / (D) No error', ['B', 'A', 'C', 'D'], 0, '"Neither" is singular → "is correct".', 'medium'],
    ['Find the part with an error: (A) I am looking forward / (B) to meet you / (C) next week. / (D) No error', ['B', 'A', 'C', 'D'], 0, '"Look forward to" + gerund → "to meeting you".', 'medium'],
    ['Find the part with an error: (A) The scissors / (B) is very sharp / (C) so be careful. / (D) No error', ['B', 'A', 'C', 'D'], 0, '"Scissors" is plural → "are very sharp".', 'easy'],
    ['Find the part with an error: (A) He told that / (B) he would join / (C) the team soon. / (D) No error', ['A', 'B', 'C', 'D'], 0, '"Told" needs an object (told me that) or use "said that".', 'hard'],
    ['Find the part with an error: (A) She is the most / (B) intelligent student / (C) of the class. / (D) No error', ['C', 'A', 'B', 'D'], 0, 'Use "in the class" with superlatives referring to a group/place.', 'hard'],
    ['Find the part with an error: (A) Ram and Shyam / (B) is going / (C) to the market. / (D) No error', ['B', 'A', 'C', 'D'], 0, 'Two subjects joined by "and" take a plural verb: "are going".', 'easy'],
    ['Find the part with an error: (A) The committee / (B) has submitted / (C) its report on time. / (D) No error', ['D', 'A', 'B', 'C'], 0, 'The sentence is correct: the committee acts as one body.', 'medium'],
    ['Find the part with an error: (A) Unless you do not work hard, / (B) you will not / (C) clear the exam. / (D) No error', ['A', 'B', 'C', 'D'], 0, '"Unless" already means "if not" → "Unless you work hard".', 'hard'],
    ['Find the part with an error: (A) One should do / (B) his duty / (C) sincerely. / (D) No error', ['B', 'A', 'C', 'D'], 0, '"One" should be followed by "one\'s".', 'hard'],
  ],
  'fill-in-the-blanks': [
    ['The interview is scheduled ___ Monday.', ['on', 'in', 'at', 'by'], 0, 'Days take "on".', 'easy'],
    ['She is good ___ problem-solving.', ['at', 'in', 'on', 'for'], 0, '"Good at" a skill.', 'easy'],
    ['The meeting was ___ due to the heavy rain.', ['postponed', 'preponed', 'proceeded', 'promoted'], 0, 'Postponed = moved to a later time.', 'easy'],
    ['He was ___ for his outstanding contribution.', ['commended', 'commanded', 'commenced', 'commuted'], 0, 'Commended = praised.', 'medium'],
    ['The new policy will ___ effect from next month.', ['take', 'make', 'give', 'bring'], 0, 'Idiom: "take effect".', 'medium'],
    ['Despite several attempts, the code ___ to compile.', ['failed', 'fails', 'failing', 'fail'], 0, 'Past narrative → "failed".', 'easy'],
    ['The candidate\'s answers were ___ and to the point.', ['concise', 'verbose', 'vague', 'redundant'], 0, '"To the point" suggests concise.', 'medium'],
    ['He has a ___ for learning new languages.', ['knack', 'knock', 'nag', 'knick'], 0, 'Knack = natural skill.', 'medium'],
    ['The professor ___ the importance of practice.', ['emphasised', 'emphasis', 'emphatic', 'emphasising'], 0, 'A past-tense verb is needed.', 'easy'],
    ['The results were ___ with our expectations.', ['consistent', 'constant', 'consisting', 'consistency'], 0, '"Consistent with" = in agreement with.', 'medium'],
    ['Her ___ attitude made her popular in the team.', ['amiable', 'amicable', 'amenable', 'ambient'], 0, 'Amiable = friendly (for a person).', 'hard'],
    ['The two companies reached an ___ settlement.', ['amicable', 'amiable', 'ambiguous', 'ample'], 0, 'Amicable = friendly (for agreements/relations).', 'hard'],
    ['The project was completed ___ the deadline.', ['before', 'since', 'during', 'among'], 0, '"Before the deadline".', 'easy'],
    ['We must ___ the risks before launching the product.', ['assess', 'access', 'excess', 'asses'], 0, 'Assess = evaluate.', 'medium'],
  ],
  'sentence-completion': [
    ['Although the task was difficult, ___', ['she completed it on time.', 'but she completed it.', 'so she completed it.', 'and she completed it.'], 0, '"Although" should not be followed by "but", "so" or "and".', 'easy'],
    ['The more you practise, ___', ['the better you become.', 'you become better.', 'better you become.', 'the best you become.'], 0, 'The "the more ..., the + comparative" structure.', 'medium'],
    ['Not only did he lead the project, ___', ['but he also presented it.', 'he also presented it.', 'and he presented it.', 'so he presented it.'], 0, '"Not only ... but also".', 'medium'],
    ['If she had studied harder, ___', ['she would have passed.', 'she will pass.', 'she would pass.', 'she passes.'], 0, 'Third conditional: had + pp → would have + pp.', 'medium'],
    ['He was so tired that ___', ['he fell asleep immediately.', 'he fell asleep so.', 'falling asleep.', 'so he fell asleep.'], 0, '"So ... that" + result clause.', 'easy'],
    ['Unless you submit the form today, ___', ['you will miss the opportunity.', 'you will not miss the opportunity.', 'you missed the opportunity.', 'you miss the opportunity yesterday.'], 0, '"Unless" (= if not) + future result.', 'easy'],
    ['No sooner had the bell rung ___', ['than the students left.', 'when the students left.', 'then the students left.', 'the students left.'], 0, '"No sooner ... than".', 'hard'],
    ['She speaks English as fluently as ___', ['a native speaker does.', 'native speaker.', 'a native speaker speak.', 'than a native speaker.'], 0, '"As ... as" comparison with a complete clause.', 'hard'],
    ['Hardly had we reached the venue ___', ['when it started raining.', 'than it started raining.', 'then it started raining.', 'it started raining.'], 0, '"Hardly ... when".', 'hard'],
    ['To succeed in interviews, one must ___', ['prepare thoroughly and stay calm.', 'preparing thoroughly.', 'prepared thoroughly.', 'to prepare thoroughly.'], 0, '"Must" is followed by a base verb.', 'easy'],
  ],
  'para-jumbles': [
    ['Arrange: P: She practised daily. Q: Priya wanted to crack placements. R: Finally, she got an offer. S: She also took mock tests.', ['QPSR', 'PQSR', 'QSPR', 'RQPS'], 0, 'Goal (Q) → daily practice (P) → mock tests (S) → result (R).', 'easy'],
    ['Arrange: P: Then add the vegetables. Q: First, heat oil in a pan. R: Finally, garnish and serve. S: Cook until soft.', ['QPSR', 'PQSR', 'QSPR', 'SQPR'], 0, 'First → then → until soft → finally.', 'easy'],
    ['Arrange: P: This leads to better retention. Q: Spaced repetition revisits topics at increasing intervals. R: Many toppers use it for exams. S: Each revision strengthens memory.', ['QSPR', 'QPSR', 'SQPR', 'RQSP'], 0, 'Definition (Q) → mechanism (S) → result (P) → example (R).', 'medium'],
    ['Arrange: P: However, it also has risks. Q: Social media helps people stay connected. R: Therefore, it should be used wisely. S: Misinformation spreads quickly on it.', ['QPSR', 'QSPR', 'PQSR', 'QRPS'], 0, 'Benefit (Q) → however (P) → example of risk (S) → conclusion (R).', 'medium'],
    ['Arrange: P: The server returns a response. Q: A user types a URL in the browser. R: The browser renders the page. S: DNS resolves the domain to an IP address.', ['QSPR', 'QPSR', 'SQPR', 'QSRP'], 0, 'Request flow: URL → DNS → server response → render.', 'medium'],
    ['Arrange: P: It was rejected in the first review. Q: The team proposed a new design. R: The improved version was approved. S: They incorporated the feedback.', ['QPSR', 'QSPR', 'PQSR', 'QPRS'], 0, 'Proposal → rejection → feedback incorporated → approval.', 'easy'],
    ['Arrange: P: As a result, sales grew by 30%. Q: The startup studied customer complaints. R: It redesigned its checkout process. S: Most complaints were about slow payments.', ['QSRP', 'QRSP', 'SQRP', 'QSPR'], 0, 'Study (Q) → finding (S) → action (R) → result (P).', 'hard'],
    ['Arrange: P: Consequently, many species are endangered. Q: Forests are being cleared for agriculture. R: Animals lose their natural habitat. S: Conservation programmes are now essential.', ['QRPS', 'QPRS', 'RQPS', 'QRSP'], 0, 'Cause (Q) → effect (R) → consequence (P) → solution (S).', 'hard'],
    ['Arrange: P: He then joined a startup as an intern. Q: Arun completed his B.Tech in 2022. R: Today he leads a team of five. S: His performance earned him a full-time role.', ['QPSR', 'QSPR', 'PQSR', 'QPRS'], 0, 'Chronological: graduation → internship → full-time role → today.', 'medium'],
    ['Arrange: P: Write test cases first. Q: Test-driven development follows a cycle. R: Then refactor the code. S: Next, write code to pass them.', ['QPSR', 'QSPR', 'PQSR', 'QPRS'], 0, 'TDD: tests → code → refactor.', 'hard'],
  ],
};

const RC = [
  {
    passage: 'Cloud computing allows companies to rent computing power instead of buying and maintaining their own servers. This shift lets small startups access the same infrastructure as large corporations, paying only for what they use. However, it also creates new responsibilities: data stored on third-party servers must be secured carefully, and costs can grow quickly if usage is not monitored.',
    qs: [
      ['According to the passage, what is the main advantage of cloud computing for startups?', ['Access to large-scale infrastructure while paying only for usage', 'Free servers for all companies', 'No need for any security', 'Guaranteed lower costs in every case'], 0, 'The passage says startups access the same infrastructure and pay only for what they use.', 'easy'],
      ['Which risk is mentioned in the passage?', ['Costs can rise if usage is not monitored', 'Cloud servers are always slower', 'Startups cannot use the cloud', 'Data is automatically public'], 0, 'The passage warns costs can grow quickly without monitoring.', 'easy'],
      ['The word "shift" in the passage most nearly means:', ['Change', 'Shiftwork', 'Movement of goods', 'Delay'], 0, 'Here "shift" refers to a change in how companies obtain computing power.', 'medium'],
      ['What is the tone of the passage?', ['Balanced', 'Strongly critical', 'Humorous', 'Sarcastic'], 0, 'It presents both benefits and responsibilities.', 'medium'],
    ],
  },
  {
    passage: 'Effective teams are not built only from skilled individuals. Research on team performance often highlights psychological safety — the belief that one can speak up, ask questions or admit mistakes without being embarrassed. When members feel safe, they share ideas earlier, catch errors sooner and learn faster. Leaders create this environment by listening actively and responding to mistakes as learning opportunities rather than failures.',
    qs: [
      ['What does "psychological safety" mean in the passage?', ['Feeling able to speak up without fear of embarrassment', 'Physical safety at the workplace', 'Job security for life', 'Avoiding all mistakes'], 0, 'The passage defines it directly.', 'easy'],
      ['According to the passage, how do leaders build psychological safety?', ['By listening and treating mistakes as learning opportunities', 'By hiring only experts', 'By punishing errors strictly', 'By reducing meetings'], 0, 'Stated in the last sentence.', 'medium'],
      ['Which is NOT mentioned as a benefit of psychological safety?', ['Higher salaries', 'Ideas shared earlier', 'Errors caught sooner', 'Faster learning'], 0, 'Salaries are not mentioned.', 'medium'],
      ['The main idea of the passage is that:', ['Team success depends on a safe environment as well as skills', 'Skilled people always form good teams', 'Leaders should avoid feedback', 'Mistakes should be hidden'], 0, 'The opening sentence and the body support this.', 'hard'],
    ],
  },
  {
    passage: 'The first computer "bug" is often linked to 1947, when engineers working on the Harvard Mark II found a moth trapped in a relay and taped it into their logbook. While the term "bug" for a technical fault existed before, the story became popular and helped make "debugging" a common word in computing. Today, debugging involves systematic techniques such as reproducing the issue, isolating the cause and verifying the fix.',
    qs: [
      ['What was found in the Harvard Mark II in 1947?', ['A moth in a relay', 'A broken monitor', 'A virus program', 'A missing cable'], 0, 'Stated in the first sentence.', 'easy'],
      ['What does the passage say about the word "bug"?', ['It was used for technical faults even before 1947', 'It was invented in 1947', 'It only refers to insects', 'It is no longer used'], 0, 'The passage says the term existed before.', 'medium'],
      ['Which step of modern debugging is mentioned?', ['Isolating the cause', 'Rewriting the whole program', 'Ignoring rare errors', 'Buying new hardware'], 0, 'Reproduce, isolate, verify.', 'easy'],
      ['The passage is best described as:', ['A short history and explanation of debugging', 'An advertisement for computers', 'A biography of an engineer', 'A complaint about insects'], 0, 'It combines history with present-day practice.', 'hard'],
    ],
  },
  {
    passage: 'Many students prepare for placements by solving hundreds of coding problems, yet still struggle in interviews. One reason is that interviews test communication as much as correctness. Interviewers want to hear how a candidate clarifies requirements, considers edge cases and explains trade-offs. Practising aloud, even alone, helps students turn silent problem-solving into a clear conversation.',
    qs: [
      ['Why do some students struggle in interviews despite solving many problems?', ['Interviews also test communication', 'They solve too many problems', 'Interviewers do not ask coding questions', 'They forget programming languages'], 0, 'The passage gives communication as one reason.', 'easy'],
      ['What does the passage recommend?', ['Practising explanations aloud', 'Avoiding edge cases', 'Writing code silently', 'Memorising solutions'], 0, 'Last sentence.', 'easy'],
      ['"Trade-offs" in the passage refers to:', ['Comparing advantages and disadvantages of approaches', 'Exchanging goods', 'Negotiating salary', 'Switching jobs'], 0, 'In technical interviews, trade-offs compare approaches.', 'medium'],
      ['Which would the author most likely agree with?', ['Correct code alone is not enough in interviews', 'Communication is irrelevant for engineers', 'Edge cases should be ignored', 'Practice is unnecessary'], 0, 'Consistent with the passage\'s argument.', 'hard'],
    ],
  },
];

const LESSONS = {
  'reading-comprehension': ['Reading Comprehension', 'Read the questions first, then the passage actively, noting the main idea, tone and key facts.', ['Answer only from the passage, not outside knowledge', 'Main idea questions → first and last sentences', 'Vocabulary-in-context: substitute each option into the sentence', 'Tone words: balanced, critical, optimistic, neutral']],
  synonyms: ['Synonyms', 'A synonym is a word with the same or nearly the same meaning.', ['Use the word in a sentence and substitute options', 'Learn words in groups (e.g. happy: elated, jubilant)', 'Watch for antonym traps among the options']],
  antonyms: ['Antonyms', 'An antonym is a word with the opposite meaning.', ['First find the exact meaning, then its opposite', 'Prefixes like un-, in-, dis-, mal- often form antonyms', 'Eliminate synonyms placed as traps']],
  grammar: ['Grammar Essentials', 'Most placement grammar questions test subject-verb agreement, tenses, articles, prepositions and conjunction pairs.', ['Each/every/either/neither → singular verb', 'Since + point in time; for + duration', 'Hardly/scarcely ... when; no sooner ... than', 'An before vowel sounds (an hour, a university)']],
  'sentence-correction': ['Sentence Correction', 'Pick the version that is grammatically correct, clear and concise.', ['Check agreement, tense and pronouns first', 'Remove redundancy (revert back, return back)', 'Uncountable nouns: advice, information, equipment']],
  'error-detection': ['Error Detection', 'Identify which part of a sentence contains a grammatical error.', ['Read the whole sentence before judging a part', 'Common errors: agreement, prepositions, comparatives, pronoun case', '"No error" is a valid option — do not force an error']],
  'fill-in-the-blanks': ['Fill in the Blanks', 'Choose the word that fits grammatically and in meaning.', ['Use grammar to eliminate options first', 'Look for clue words (although, because, despite)', 'Watch confusable words: affect/effect, amiable/amicable, assess/access']],
  'para-jumbles': ['Para Jumbles', 'Arrange sentences into a logical paragraph.', ['Find the opening sentence (introduces the topic, no pronoun reference)', 'Find mandatory pairs (a pronoun and its noun, "however" and its contrast)', 'Look for time order and cause-effect']],
  'sentence-completion': ['Sentence Completion', 'Complete sentences using correct structures and logical meaning.', ['Conjunction pairs: not only...but also, either...or', 'Conditionals: if + past perfect → would have + pp', '"Although" never with "but"']],
  vocabulary: ['Vocabulary Building', 'A strong vocabulary helps in reading, writing and interviews.', ['Learn 10 words a day with meaning and an example sentence', 'Use roots: bene = good, mal = bad, chron = time', 'Revise using spaced repetition']],
  'active-and-passive-voice': ['Active and Passive Voice', 'In passive voice, the object becomes the subject and the verb becomes "be + past participle".', ['Simple present: is/are + pp', 'Simple past: was/were + pp', 'Continuous: is being / was being + pp', 'Perfect: has/have/had been + pp', 'Future: will be + pp']],
  'direct-and-indirect-speech': ['Direct and Indirect Speech', 'Reported speech changes pronouns, tenses and time words.', ['Present → past, past → past perfect, will → would, can → could', 'Universal truths keep the present tense', 'Today → that day, tomorrow → the next day, yesterday → the previous day, this → that', 'Questions: asked + if/wh-word + statement order']],
};

function build() {
  const questions = [];
  questions.push(...generateTopic('verbal', 'synonyms', wordGens('syn'), 18, 501));
  questions.push(...generateTopic('verbal', 'antonyms', wordGens('ant'), 18, 502));
  questions.push(...generateTopic('verbal', 'vocabulary', wordGens('voc'), 18, 503));
  questions.push(...generateTopic('verbal', 'active-and-passive-voice', { easy: [voiceGen([0, 1])], medium: [voiceGen([2, 3])], hard: [voiceGen([3, 4, 2])] }, 16, 504));
  questions.push(...handwritten('verbal', 'direct-and-indirect-speech', DI.map(([q, a, d], i) => [`Change into indirect speech: ${q}`, [a, ...d], 0, `Reporting verb in past → backshift tenses and change pronouns/time words. Correct: ${a}`, i < 5 ? 'easy' : i < 11 ? 'medium' : 'hard'])));
  Object.entries(HW).forEach(([slug, list]) => questions.push(...handwritten('verbal', slug, list)));
  RC.forEach((p) => questions.push(...handwritten('verbal', 'reading-comprehension', p.qs.map(([q, o, a, e, d]) => [`Passage: ${p.passage}\n\nQuestion: ${q}`, o, a, e, d]))));
  // Shuffle option order of hand-written questions so the correct answer is not always first.
  const { rng } = require('./lib');
  const r = rng(777);
  questions.forEach((q) => {
    const correct = q.options[q.answer_index];
    q.options = shuffle(r, q.options);
    q.answer_index = q.options.indexOf(correct);
  });
  const topics = Object.entries(LESSONS).map(([slug, [title, explanation, tips]], i) => ({
    slug, title, summary: explanation.split('.')[0] + '.', sort: i,
    lesson: { title, difficulty: 'easy', minutes: 15, content: { explanation, shortcuts: tips, word_list: slug === 'vocabulary' ? WB.slice(0, 30).map(([w, m, s, a]) => ({ word: w, meaning: m, synonym: s, antonym: a })) : undefined, practice_note: 'Practise with timed quizzes below.' } },
  }));
  return { topics, questions };
}

module.exports = { build };
