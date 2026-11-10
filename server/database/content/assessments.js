// Timed placement assessments. Aptitude tests reuse questions from the aptitude bank (picked
// deterministically across topics); the two technical tests use the hand-written MCQs below.
const { rng, shuffle } = require('./lib');

const CS = [
  ['oops', 'Which OOP principle is best illustrated by making fields private and exposing getters/setters?', ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'], 0, 'Hiding data behind methods is encapsulation.'],
  ['oops', 'Method overriding is an example of:', ['Runtime polymorphism', 'Compile-time polymorphism', 'Encapsulation', 'Aggregation'], 0, 'The overridden method is selected at runtime based on the object type.'],
  ['oops', 'A "Car has an Engine" relationship is best modelled using:', ['Composition', 'Inheritance', 'Overloading', 'Interfaces only'], 0, 'has-a relationships are modelled with composition.'],
  ['oops', 'Which statement about abstract classes in Java is TRUE?', ['They can have constructors', 'They can be instantiated directly', 'They cannot have concrete methods', 'A class can extend several of them'], 0, 'Abstract classes can have constructors, which run when subclasses are created.'],
  ['dbms', 'Which normal form removes transitive dependencies?', ['3NF', '1NF', '2NF', 'None of these'], 0, '3NF requires no non-key attribute to depend on another non-key attribute.'],
  ['dbms', 'In ACID, "Isolation" means:', ['Concurrent transactions do not see each other\'s partial changes', 'Data survives crashes', 'Transactions are all-or-nothing', 'Constraints always hold'], 0, 'Durability, atomicity and consistency are the other properties.'],
  ['dbms', 'A foreign key is used to:', ['Reference a primary key in another table', 'Speed up all queries automatically', 'Store encrypted data', 'Uniquely identify every row in its own table'], 0, 'Foreign keys enforce referential integrity between tables.'],
  ['dbms', 'Which index type is most commonly used for range queries in relational databases?', ['B+ tree', 'Hash index', 'Bitmap only', 'No index can help'], 0, 'B+ trees keep keys ordered, supporting range scans.'],
  ['sql', 'Which clause filters groups after aggregation?', ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'], 0, 'WHERE filters rows before grouping; HAVING filters groups.'],
  ['sql', 'A LEFT JOIN returns:', ['All rows from the left table plus matching rows from the right', 'Only matching rows', 'All rows from both tables', 'Only non-matching rows'], 0, 'Unmatched right-side columns are NULL.'],
  ['sql', 'Which function assigns the same rank to ties without gaps (1, 1, 2)?', ['DENSE_RANK()', 'RANK()', 'ROW_NUMBER()', 'COUNT()'], 0, 'RANK leaves gaps; ROW_NUMBER is always unique.'],
  ['sql', 'Which statement removes a table definition and its data?', ['DROP TABLE', 'DELETE FROM', 'TRUNCATE TABLE', 'REMOVE TABLE'], 0, 'DELETE/TRUNCATE remove rows but keep the table.'],
  ['os', 'Which scheduling algorithm can cause starvation of long processes?', ['Shortest Job First', 'Round Robin', 'First Come First Served', 'None'], 0, 'SJF keeps preferring short jobs.'],
  ['os', 'Which is NOT one of the four necessary conditions for deadlock?', ['Preemption', 'Mutual exclusion', 'Hold and wait', 'Circular wait'], 0, 'The condition is NO preemption.'],
  ['os', 'Threads of the same process share:', ['The address space (heap and code)', 'Their stacks', 'Their registers', 'Nothing'], 0, 'Each thread has its own stack and registers but shares the heap and code.'],
  ['os', 'A page fault occurs when:', ['A referenced page is not in physical memory', 'A program divides by zero', 'The CPU overheats', 'A file is not found'], 0, 'The OS loads the page from disk.'],
  ['cn', 'Which protocol is connection-oriented and reliable?', ['TCP', 'UDP', 'IP', 'ICMP'], 0, 'TCP uses a handshake, acknowledgements and retransmission.'],
  ['cn', 'DNS is used to:', ['Translate domain names into IP addresses', 'Encrypt web traffic', 'Assign MAC addresses', 'Route packets between networks'], 0, 'DNS resolves names like example.com to IP addresses.'],
  ['cn', 'Which HTTP status code means "Not Found"?', ['404', '200', '301', '500'], 0, '404 indicates the resource does not exist.'],
  ['cn', 'At which OSI layer do routers mainly operate?', ['Network layer', 'Data link layer', 'Transport layer', 'Application layer'], 0, 'Routers forward packets using IP addresses (layer 3).'],
];

const DSA = [
  ['complexity', 'What is the time complexity of binary search on a sorted array of n elements?', ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], 0, 'The search range halves each step.'],
  ['complexity', 'Two nested loops each running n times have complexity:', ['O(n²)', 'O(n)', 'O(2n)', 'O(log n)'], 0, 'n × n iterations.'],
  ['arrays', 'Accessing arr[i] in an array takes:', ['O(1)', 'O(i)', 'O(n)', 'O(log n)'], 0, 'Direct address computation from the base address.'],
  ['stacks', 'Which data structure is used to check balanced parentheses?', ['Stack', 'Queue', 'Heap', 'Graph'], 0, 'The most recent unmatched opener must match first (LIFO).'],
  ['queues', 'Breadth-first search uses a:', ['Queue', 'Stack', 'Priority queue only', 'Hash set only'], 0, 'BFS processes nodes in FIFO order level by level.'],
  ['hashing', 'Average time to look up a key in a hash table is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'With a good hash function and resizing.'],
  ['sorting', 'Which sorting algorithm is stable and always O(n log n)?', ['Merge sort', 'Quick sort', 'Heap sort', 'Selection sort'], 0, 'Merge sort is stable with guaranteed O(n log n).'],
  ['sorting', 'What is the worst-case time of quicksort?', ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'], 0, 'Occurs with consistently poor pivots.'],
  ['trees', 'Inorder traversal of a binary search tree gives:', ['Keys in sorted order', 'Keys in reverse insertion order', 'Level-by-level order', 'Random order'], 0, 'Left < root < right.'],
  ['trees', 'The maximum number of nodes in a binary tree of height h (root at height 1) is:', ['2^h - 1', '2^h', 'h²', '2h'], 0, 'Sum of 1 + 2 + 4 + ... + 2^(h-1).'],
  ['heaps', 'In a min-heap, the smallest element is at:', ['The root', 'The last leaf', 'A random position', 'The leftmost leaf'], 0, 'The heap property keeps the minimum at the root.'],
  ['graphs', 'Dijkstra\'s algorithm requires edge weights to be:', ['Non-negative', 'Negative', 'All equal', 'Integers only'], 0, 'Negative edges break its greedy finalisation.'],
  ['graphs', 'Topological sorting is possible only for:', ['Directed acyclic graphs', 'Undirected graphs', 'Graphs with cycles', 'Complete graphs'], 0, 'A cycle has no valid ordering.'],
  ['dp', 'Dynamic programming is useful when a problem has:', ['Overlapping subproblems and optimal substructure', 'No repeated work', 'Only one possible solution', 'Random inputs'], 0, 'Storing subproblem results avoids recomputation.'],
  ['recursion', 'What does this return for n = 4?  f(n) = n <= 1 ? 1 : n * f(n - 1)', ['24', '10', '4', '16'], 0, '4 × 3 × 2 × 1 = 24.'],
  ['bits', 'For a positive integer n, (n & (n - 1)) == 0 means n is:', ['A power of two', 'Odd', 'Prime', 'A perfect square'], 0, 'Powers of two have exactly one set bit.'],
  ['java', 'In Java, which collection does NOT allow duplicate elements?', ['HashSet', 'ArrayList', 'LinkedList', 'Vector'], 0, 'Sets store unique elements.'],
  ['python', 'In Python, what is the output of print(7 // 2, 7 % 2)?', ['3 1', '3.5 1', '3 0', '4 1'], 0, '// is floor division, % is remainder.'],
  ['c', 'In C, if int a[5]; and p = a; then *(p + 2) refers to:', ['a[2]', 'a[0] + 2', 'The address of a[2]', 'a[3]'], 0, 'Pointer arithmetic moves by element size.'],
  ['two-pointers', 'Finding a pair with a given sum in a SORTED array using two pointers takes:', ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n) always'], 0, 'Each step moves one pointer inward.'],
];

const ASSESSMENTS = [
  { slug: 'quant-mock-1', title: 'Quantitative Aptitude Mock Test', description: '20 timed questions across percentages, profit & loss, time & work, TSD, probability and more.', category: 'aptitude', duration_min: 25, pass_percent: 60, from: { section: 'quant', count: 20, seed: 11 } },
  { slug: 'logical-mock-1', title: 'Logical Reasoning Mock Test', description: '20 timed questions on series, coding-decoding, arrangements, syllogisms and more.', category: 'aptitude', duration_min: 25, pass_percent: 60, from: { section: 'logical', count: 20, seed: 12 } },
  { slug: 'verbal-mock-1', title: 'Verbal Ability Mock Test', description: '20 questions on vocabulary, grammar, sentence correction and comprehension.', category: 'aptitude', duration_min: 20, pass_percent: 60, from: { section: 'verbal', count: 20, seed: 13 } },
  { slug: 'placement-mock-1', title: 'Full Placement Mock (Service Companies Pattern)', description: '30 mixed questions (quant, logical, verbal) in the style of service-company online tests.', category: 'placement', duration_min: 40, pass_percent: 60, from: { section: 'mixed', count: 30, seed: 14 } },
  { slug: 'cs-fundamentals-1', title: 'CS Fundamentals Test', description: 'OOP, DBMS, SQL, Operating Systems and Computer Networks — 20 questions.', category: 'technical', duration_min: 20, pass_percent: 60, list: CS },
  { slug: 'dsa-concepts-1', title: 'Programming & DSA Concepts Test', description: 'Complexity, data structures, algorithms and language basics — 20 questions.', category: 'technical', duration_min: 20, pass_percent: 60, list: DSA },
];

/** Build assessment rows; aptitudeQuestions is the full generated aptitude bank. */
function build(aptitudeQuestions) {
  return ASSESSMENTS.map((a) => {
    let questions;
    if (a.list) {
      const r = rng(a.slug.length * 31);
      questions = a.list.map(([topic, q, opts, ai, e]) => {
        const correct = opts[ai];
        const shuffled = shuffle(r, opts);
        return { topic, question: q, options: shuffled, answer_index: shuffled.indexOf(correct), explanation: e };
      });
    } else {
      const r = rng(a.from.seed);
      const pool = aptitudeQuestions.filter((q) => (a.from.section === 'mixed' || q.section === a.from.section) && q.difficulty !== 'hard' && !q.question.startsWith('Passage:'));
      const byTopic = {};
      pool.forEach((q) => { (byTopic[q.topic_slug] = byTopic[q.topic_slug] || []).push(q); });
      const topics = shuffle(r, Object.keys(byTopic));
      questions = [];
      let i = 0;
      while (questions.length < a.from.count) {
        const list = byTopic[topics[i % topics.length]];
        const q = list[Math.floor(r() * list.length)];
        if (!questions.includes(q)) questions.push(q);
        i++;
      }
      questions = questions.map((q) => ({ topic: q.topic_slug, question: q.question, options: q.options, answer_index: q.answer_index, explanation: q.explanation }));
    }
    const { list, from, ...meta } = a;
    void list; void from;
    return { ...meta, questions };
  });
}

module.exports = { build };
