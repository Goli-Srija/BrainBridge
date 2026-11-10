// Video learning + external resources.
// YouTube IDs below were verified via web search results (title + freeCodeCamp channel) on 2026-11-10.
// Where no specific video was verified for a category, only well-known platform/documentation links are used.
const yt = (id) => `https://www.youtube.com/watch?v=${id}`;

const VIDEOS = [
  // category, title, topic, description, source, url, embedId
  ['Python', 'Learn Python - Full Course for Beginners', 'Python basics', 'A long-form beginner course covering Python syntax, data types, functions, classes and small projects.', 'freeCodeCamp.org (YouTube)', yt('rfscVS0vtbw'), 'rfscVS0vtbw'],
  ['Java', 'Learn Java 8 - Full Tutorial for Beginners', 'Java basics', 'Covers Java setup, variables, control flow, OOP and collections for beginners.', 'freeCodeCamp.org (YouTube)', yt('grEKMHGYyns'), 'grEKMHGYyns'],
  ['C', 'C Programming Tutorial for Beginners', 'C basics', 'Introduction to C: variables, conditions, loops, functions, arrays, structs and pointers.', 'freeCodeCamp.org (YouTube)', yt('KJgsSFOSQv0'), 'KJgsSFOSQv0'],
  ['C', 'Pointers in C for Absolute Beginners - Full Course', 'Pointers', 'A dedicated course on pointers, memory addresses and dynamic memory in C.', 'freeCodeCamp.org (YouTube)', yt('MIL2BK02X8A'), 'MIL2BK02X8A'],
  ['DSA', 'Data Structures Easy to Advanced Course', 'Data structures', 'Arrays, linked lists, stacks, queues, heaps, union-find, trees and hash tables with animations.', 'freeCodeCamp.org (YouTube)', yt('RBSGKlAvoiM'), 'RBSGKlAvoiM'],
  ['DSA', 'Data Structures - Full Course Using C and C++', 'Data structures in C', 'Implements core data structures in C/C++, useful for students following the C path.', 'freeCodeCamp.org (YouTube)', yt('B31LgI4Y4DQ'), 'B31LgI4Y4DQ'],
  ['Interviews', 'Master Technical Interviews - Full Course', 'Technical interviews', 'Strategies and problem patterns for technical coding interviews.', 'freeCodeCamp.org (YouTube)', yt('-LVmKNvflnY'), '-LVmKNvflnY'],
  ['SQL', 'SQL Tutorial - Full Database Course for Beginners', 'SQL', 'Tables, keys, queries, joins, nested queries, triggers and ER diagrams.', 'freeCodeCamp.org (YouTube)', yt('HXV3zeQKqGY'), 'HXV3zeQKqGY'],
  ['SQL', 'MySQL Database - Full Course', 'SQL with MySQL', 'Hands-on SQL practice using MySQL.', 'freeCodeCamp.org (YouTube)', yt('ER8oKX5myE0'), 'ER8oKX5myE0'],
  ['DBMS', 'Database Design Course for Beginners', 'Database design & normalisation', 'How to plan a relational database: keys, relationships and normal forms.', 'freeCodeCamp.org (YouTube)', yt('ztHopE5Wnpc'), 'ztHopE5Wnpc'],
  ['Operating Systems', 'Linux Operating System - Crash Course for Beginners', 'Linux & OS basics', 'Linux file system, commands, processes and permissions.', 'freeCodeCamp.org (YouTube)', yt('ROjZy1WbCIA'), 'ROjZy1WbCIA'],
  ['Computer Networks', 'How does the Internet Work? (Full Course)', 'Networking fundamentals', 'IP, TCP, DNS, HTTP and how data moves across networks.', 'freeCodeCamp.org (YouTube)', yt('zN8YNNHcaZc'), 'zN8YNNHcaZc'],
  ['Computer Networks', 'Full HTTP Networking Course', 'HTTP & REST', 'HTTP requests, headers, methods and REST APIs using JavaScript fetch.', 'freeCodeCamp.org (YouTube)', yt('2JYT5f2isg4'), '2JYT5f2isg4'],
  ['OOPs', 'Intro to Object Oriented Programming - Crash Course', 'OOP concepts', 'Encapsulation, abstraction, inheritance and polymorphism explained with examples.', 'freeCodeCamp.org (YouTube)', yt('SiBw7os-_zI'), 'SiBw7os-_zI'],
  ['OOPs', 'Object Oriented Programming with Python - Full Course for Beginners', 'OOP in Python', 'Classes, objects, inheritance and class design in Python.', 'freeCodeCamp.org (YouTube)', yt('Ej_02ICOIgs'), 'Ej_02ICOIgs'],
];

// Articles / documentation / platforms (verified article URLs from search results, plus official docs and platform home pages)
const LINKS = [
  ['Operating Systems', 'Learn about Operating Systems in Depth', 'Operating systems', 'freeCodeCamp article introducing a comprehensive OS course (processes, scheduling, memory).', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/learn-about-operating-systems-in-depth/', 'article'],
  ['Computer Networks', 'HTTP Networking Protocol Course', 'HTTP', 'freeCodeCamp article accompanying the HTTP networking course.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/http-networking-protocol-course/', 'article'],
  ['DBMS', 'Learn Relational Database Design', 'Database design', 'freeCodeCamp article on relational database design.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/learn-relational-database-design/', 'article'],
  ['SQL', 'Learn Databases and SQL from Harvard University', 'SQL', 'freeCodeCamp article about Harvard\'s CS50 SQL course.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/learn-databases-and-sql-from-harvard-university/', 'article'],
  ['DSA', 'Data Structure and Algorithm Patterns for LeetCode Interviews', 'Interview patterns', 'freeCodeCamp article on common DSA patterns for interviews.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/data-structure-and-algorithm-patterns-for-leetcode-interviews/', 'article'],
  ['Interviews', 'Master Technical Interviews by Learning Data Structures and Algorithms', 'Interview preparation', 'freeCodeCamp article on preparing for technical interviews.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/master-technical-interviews-by-learning-data-structures-and-algorithms/', 'article'],
  ['OOPs', 'Object Oriented Programming Crash Course', 'OOP', 'freeCodeCamp article for the OOP crash course.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/object-oriented-programming-crash-course/', 'article'],
  ['Communication', 'How to Improve Communication Skills', 'Communication', 'freeCodeCamp article with practical communication tips.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/how-to-improve-communication-skills/', 'article'],
  ['Resume building', 'How to Write a Good Resume (developer guide)', 'Resume', 'freeCodeCamp article on structuring a developer resume.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/how-to-write-a-good-resume-in-2017-b8ea9dfdd3b9/', 'article'],
  ['Resume building', 'freeCodeCamp articles tagged "resume"', 'Resume', 'Collection of resume-writing articles.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/tag/resume/', 'article'],
  ['Java', 'Java for Absolute Beginners - Full Course (article)', 'Java', 'freeCodeCamp article for a beginner Java course.', 'freeCodeCamp News', 'https://www.freecodecamp.org/news/java-for-absolute-beginners-full-course/', 'article'],
  ['Java', 'Learn Java (official dev.java tutorials)', 'Java', 'Official learning path from the Java team at Oracle.', 'dev.java', 'https://dev.java/learn/', 'course'],
  ['Python', 'The Python Tutorial (official)', 'Python', 'The official Python tutorial from python.org.', 'Python Software Foundation', 'https://docs.python.org/3/tutorial/', 'course'],
  ['C', 'C language reference', 'C', 'Reference for the C standard library and language.', 'cppreference.com', 'https://en.cppreference.com/w/c', 'course'],
  ['SQL', 'PostgreSQL Tutorial (official documentation)', 'SQL', 'The official PostgreSQL tutorial chapter.', 'PostgreSQL Global Development Group', 'https://www.postgresql.org/docs/current/tutorial.html', 'course'],
  ['SQL', 'SQLBolt - Interactive SQL lessons', 'SQL practice', 'Short interactive SQL exercises in the browser.', 'SQLBolt', 'https://sqlbolt.com/', 'platform'],
  ['Aptitude', 'IndiaBix - Aptitude Questions and Answers', 'Quantitative aptitude', 'Topic-wise aptitude practice questions with explanations.', 'IndiaBix', 'https://www.indiabix.com/aptitude/questions-and-answers/', 'platform'],
  ['Logical Reasoning', 'IndiaBix - Logical Reasoning', 'Logical reasoning', 'Topic-wise logical reasoning practice.', 'IndiaBix', 'https://www.indiabix.com/logical-reasoning/questions-and-answers/', 'platform'],
  ['Verbal Ability', 'IndiaBix - Verbal Ability', 'Verbal ability', 'Synonyms, antonyms, sentence correction and more.', 'IndiaBix', 'https://www.indiabix.com/verbal-ability/questions-and-answers/', 'platform'],
  ['Aptitude', 'Khan Academy - Math', 'Mathematics', 'Free lessons on arithmetic, ratios, percentages and probability.', 'Khan Academy', 'https://www.khanacademy.org/math', 'course'],
  ['DSA', 'LeetCode', 'Coding practice', 'Coding interview practice platform (use for extra practice after BrainBridge problems).', 'LeetCode', 'https://leetcode.com/', 'platform'],
  ['DSA', 'HackerRank', 'Coding practice', 'Practice tracks and company-style coding tests.', 'HackerRank', 'https://www.hackerrank.com/', 'platform'],
  ['DSA', 'CodeChef', 'Competitive programming', 'Contests and practice problems; popular with Indian students.', 'CodeChef', 'https://www.codechef.com/', 'platform'],
  ['DSA', 'GeeksforGeeks', 'DSA articles', 'Explanations of algorithms, data structures and interview experiences.', 'GeeksforGeeks', 'https://www.geeksforgeeks.org/', 'platform'],
  ['Operating Systems', 'NPTEL - Online courses from IITs', 'Core CS', 'Free university-level courses on OS, DBMS, networks and more.', 'NPTEL', 'https://nptel.ac.in/', 'course'],
  ['Computer Networks', 'MDN Web Docs - HTTP', 'HTTP', 'Authoritative reference for HTTP methods, status codes and headers.', 'Mozilla', 'https://developer.mozilla.org/en-US/docs/Web/HTTP', 'course'],
  ['Communication', 'GitHub Skills', 'GitHub', 'Free interactive courses for Git and GitHub.', 'GitHub', 'https://skills.github.com/', 'course'],
  ['Interviews', 'freeCodeCamp Learn', 'Full-stack curriculum', 'Free interactive curriculum and certifications.', 'freeCodeCamp', 'https://www.freecodecamp.org/learn', 'course'],
];

// Additional guidance pages shown on the Resources page (written content, not links).
const GUIDES = [
  { key: 'github', title: 'GitHub guidance', points: ['Pin your 4-6 best repositories on your profile.', 'Every project needs a README: problem, features, tech stack, screenshots, how to run, live link.', 'Commit regularly with meaningful messages ("Add JWT login" not "update").', 'Add a profile README introducing yourself and your skills.', 'Never commit secrets — use .env files and .gitignore.'] },
  { key: 'linkedin', title: 'LinkedIn optimisation', points: ['Professional photo and a headline like "Final-year CSE | Java & React | Built X".', 'About section: 3-4 lines on skills, projects and what roles you want.', 'Add projects with links, certifications and skills (and get endorsements).', 'Post about what you learn and build — consistency matters more than polish.', 'Personalise connection requests to alumni and recruiters.'] },
  { key: 'internships', title: 'Internship preparation', points: ['Start applying from 2nd/3rd year: college cell, company career pages and internship portals.', 'Have one solid project and a one-page resume ready.', 'Prepare DSA basics, one language well, and your project explanation.', 'Follow up politely after applying; track applications in a spreadsheet.'] },
  { key: 'off-campus', title: 'Off-campus placement preparation', points: ['Watch official career pages of target companies for fresher drives and hiring challenges.', 'Ask alumni for referrals with a short, specific message and your resume.', 'Participate in coding contests and hackathons — some companies hire through them.', 'Verify job offers: never pay money for a job; check the company domain of emails.'] },
  { key: 'gd', title: 'Group discussion preparation', points: ['Read news daily for current-affairs topics.', 'Practise structuring a point: stance → reason → example.', 'Enter politely, acknowledge others and summarise if possible.', 'See BrainBridge Communication → Group Discussions and the GD exercise.'] },
  { key: 'networking', title: 'Professional networking', points: ['Attend tech meetups, college fests and webinars.', 'Contribute to open source or student communities.', 'Follow up after meeting people with a short thank-you message.', 'Give before you ask: share helpful resources and help peers.'] },
];

module.exports = { VIDEOS, LINKS, GUIDES };
