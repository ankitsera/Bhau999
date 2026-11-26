// data/books.js
// Free-to-read catalogue shown in the Library (limited view). Every book is a
// public-domain title or folk tale, retold here as short sample chapters.

export const BOOK_CATEGORIES = ["Classics", "Mystery", "Kids", "Folk Tales", "Self-help"];

export const BOOKS = [
  {
    id: "pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Classics",
    cover: "#7A4E2D",
    icon: "flower-tulip-outline",
    readMinutes: 6,
    description:
      "Lively Elizabeth Bennet and the proud Mr. Darcy misjudge each other at every turn, in one of the best-loved love stories ever written.",
    chapters: [
      {
        title: "A New Neighbour",
        body:
          "News travels fast in a small English village, and no news travels faster than the arrival of a rich young man. When Netherfield Park was let at last, Mrs. Bennet could speak of nothing else.\n\n\"His name is Bingley,\" she told her husband, \"and he has five thousand a year. What a fine thing for our girls!\"\n\nMr. Bennet, who enjoyed teasing his wife more than almost anything, pretended not to understand why the matter concerned their five daughters at all. But he had already called on the young gentleman, and he kept the secret for days, just to watch her worry.\n\nThe eldest daughter, Jane, was gentle and beautiful. The second, Elizabeth, was quick, clever and fond of laughing at the world, though never unkindly. Of all the family, it was Elizabeth who would have the most to learn about first impressions.",
      },
      {
        title: "The Assembly Ball",
        body:
          "At the village ball Mr. Bingley proved to be everything friendly and pleasant. He danced every dance and declared Jane the loveliest girl in the room.\n\nHis friend Mr. Darcy was another matter. He was tall, handsome and far richer, but he stood apart, spoke to almost no one, and was soon judged the proudest man in the county.\n\nWhen Bingley urged him to dance with Elizabeth, Darcy glanced at her and said, loudly enough to be overheard, that she was tolerable, but not handsome enough to tempt him.\n\nElizabeth told the story to her friends with great spirit, and they all laughed. Yet a small sting remained, and from that evening she was quite certain she knew exactly what kind of man Mr. Darcy was.",
      },
    ],
  },
  {
    id: "adventures-of-sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    category: "Mystery",
    cover: "#2F3E4E",
    icon: "magnify",
    readMinutes: 5,
    description:
      "The world's most famous detective and his loyal friend Dr. Watson solve puzzling cases in the fog-filled streets of London.",
    chapters: [
      {
        title: "The Visitor in the Mask",
        body:
          "Dr. Watson had not seen his old friend for months when he passed the familiar door at 221B Baker Street and saw a light in the window. He went up, and Sherlock Holmes greeted him as if they had parted the day before.\n\n\"You have been out in the rain lately,\" said Holmes, \"and you have a careless servant girl.\"\n\nWatson stared. Holmes only smiled and pointed to the scratches on his boot, made by someone scraping away dried mud in a hurry. \"You see, but you do not observe,\" he said.\n\nThat night a tall stranger arrived wearing a black mask. He claimed to be a messenger, but his rich clothes and proud manner told Holmes at once that he was a king in disguise, and a very worried one.",
      },
      {
        title: "A Clever Opponent",
        body:
          "The king's trouble was a single photograph. Years before, he had been fond of a singer named Irene Adler, and now the picture could ruin his royal marriage.\n\nHolmes disguised himself as a stable hand, then as a kindly clergyman, and with a staged street quarrel and a cry of \"Fire!\" he tricked Irene into revealing where the photograph was hidden.\n\nBut when Holmes returned the next morning to collect it, the house was empty. Irene had seen through every disguise. She left a polite letter, a different photograph of herself, and a promise never to trouble the king.\n\nFrom that day Holmes always spoke of her simply as the woman, the one person who had outwitted him.",
      },
    ],
  },
  {
    id: "panchatantra-monkey-crocodile",
    title: "The Monkey and the Crocodile",
    author: "Panchatantra",
    category: "Folk Tales",
    cover: "#2E7D5B",
    icon: "palm-tree",
    readMinutes: 3,
    description:
      "A wise monkey, a sweet jamun tree and a crocodile with a tricky plan, from India's oldest collection of animal fables.",
    chapters: [
      {
        title: "Friends by the River",
        body:
          "On the bank of a wide river stood a jamun tree heavy with purple fruit, and in it lived a cheerful monkey named Raktamukha.\n\nOne hot afternoon a tired crocodile rested beneath the tree. The monkey tossed him a handful of jamuns. \"Eat, friend,\" he called. \"They are the sweetest on the river.\"\n\nThe crocodile loved them. He came back the next day, and the next, and soon the two were the best of friends, talking for hours while the water rolled by.\n\nEach evening the crocodile carried some jamuns home to his wife. She ate them and thought, \"If the fruit is this sweet, how sweet must be the heart of the monkey who eats it every day!\"",
      },
      {
        title: "The Monkey's Clever Answer",
        body:
          "The crocodile's wife pretended to be ill. \"Only a monkey's heart will cure me,\" she said. Unhappy but obedient, the crocodile invited his friend home for dinner.\n\nHalfway across the river, with the monkey on his back, the crocodile confessed the truth.\n\nThe monkey thought fast. \"Why didn't you tell me earlier?\" he said calmly. \"We monkeys keep our hearts safe in the tree. Take me back and I will fetch it for your wife.\"\n\nThe foolish crocodile turned around. The moment they reached the bank, the monkey leapt into the highest branch.\n\n\"Go home,\" he called down. \"A true friend would never plan such a thing.\"\n\nMoral: Presence of mind can save you when strength cannot.",
      },
    ],
  },
  {
    id: "aesop-tortoise-hare",
    title: "Aesop's Fables",
    author: "Aesop",
    category: "Kids",
    cover: "#C0573E",
    icon: "rabbit",
    readMinutes: 3,
    description:
      "Short, timeless stories about animals that teach big lessons, perfect for reading together at bedtime.",
    chapters: [
      {
        title: "The Tortoise and the Hare",
        body:
          "A hare was always boasting about how fast he could run. \"No one has ever beaten me,\" he said. \"I challenge anyone to a race!\"\n\nThe tortoise answered quietly, \"I accept.\"\n\nThe animals laughed, but the race began. The hare shot ahead and was soon far out of sight. Sure of winning, he lay down under a shady tree for a short nap.\n\nThe tortoise kept walking, slowly and steadily, never stopping once. When the hare finally woke up, he ran with all his might, but it was too late. The tortoise was already crossing the finish line.\n\nMoral: Slow and steady wins the race.",
      },
      {
        title: "The Ant and the Grasshopper",
        body:
          "All summer long a grasshopper sang and danced in the fields, while a little ant carried grain after grain to her nest.\n\n\"Why work so hard on such a lovely day?\" laughed the grasshopper. \"Come and play!\"\n\n\"I am storing food for winter,\" said the ant, \"and you should too.\"\n\nWhen winter came, the fields were covered in snow. The hungry grasshopper knocked at the ant's door. The ant shared a little of her food, and the grasshopper promised that next summer he would sing a little less and work a little more.\n\nMoral: There is a time for work and a time for play.",
      },
    ],
  },
  {
    id: "alice-in-wonderland",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    category: "Kids",
    cover: "#5B5EA6",
    icon: "clock-time-four-outline",
    readMinutes: 5,
    description:
      "A curious girl follows a white rabbit down a hole and into a world of talking animals, strange tea parties and a very angry queen.",
    chapters: [
      {
        title: "Down the Rabbit Hole",
        body:
          "Alice was getting very tired of sitting by her sister on the riverbank with nothing to do. Her sister's book had no pictures and no conversations, and what is the use of a book like that?\n\nSuddenly a White Rabbit with pink eyes ran past, took a watch out of his waistcoat pocket and cried, \"Oh dear! Oh dear! I shall be too late!\"\n\nAlice had never seen a rabbit with a waistcoat, let alone a watch. Burning with curiosity, she ran after him and dropped straight down a large rabbit hole.\n\nShe fell, and fell, and fell, past cupboards and bookshelves and maps, wondering whether she would come out on the other side of the world.",
      },
      {
        title: "The Little Golden Key",
        body:
          "At the bottom Alice found a long hall full of locked doors. On a glass table lay a tiny golden key that opened only one very small door, and through it she could see the loveliest garden.\n\nBut she was far too big to fit.\n\nThen she found a little bottle labelled DRINK ME. She sipped it and shrank until she was just ten inches tall. Unfortunately, she had left the key on top of the table, far out of reach.\n\nA cake marked EAT ME made her grow so tall her head hit the ceiling. Alice sat down and cried, until she realised that crying would get her nowhere, and that Wonderland would take some getting used to.",
      },
    ],
  },
  {
    id: "tenali-raman",
    title: "Tales of Tenali Raman",
    author: "Indian Folk Tales",
    category: "Folk Tales",
    cover: "#B8860B",
    icon: "crown-outline",
    readMinutes: 3,
    description:
      "The witty court poet of King Krishnadevaraya solves every problem with a clever idea and a big smile.",
    chapters: [
      {
        title: "The Thieves and the Well",
        body:
          "One night Tenali Raman heard whispers outside his house. Two thieves were hiding in the bushes, waiting for the family to fall asleep.\n\nTenali spoke loudly to his wife. \"Thieves are everywhere these days. Let us put all our jewels in this box and drop it into the well, where no one will look.\"\n\nThey filled a heavy box with stones and threw it into the well with a great splash.\n\nAll night the thieves pulled up bucket after bucket of water, hoping to reach the treasure. By morning they had watered Tenali's entire garden.\n\nTenali stepped out and thanked them warmly. The thieves ran away, and his plants had never looked better.",
      },
      {
        title: "The Most Precious Gift",
        body:
          "King Krishnadevaraya once asked his court, \"What is the most precious thing a person can give?\"\n\nOne minister said gold. Another said land. A third said a fine horse.\n\nTenali Raman bowed. \"Your Majesty, the most precious gift is time. Gold can be earned again and land can be won back, but a moment given to someone in need can never be returned.\"\n\nThe king was so pleased that he spent the rest of the day listening to the problems of his people himself, and he declared it the best day of his reign.",
      },
    ],
  },
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Self-help",
    cover: "#4A5D52",
    icon: "meditation",
    readMinutes: 4,
    description:
      "Private notes of a Roman emperor on staying calm, doing good work and keeping your mind steady, as useful today as 1,800 years ago.",
    chapters: [
      {
        title: "Begin the Day Prepared",
        body:
          "Each morning, the emperor reminded himself: today I will meet people who are rude, ungrateful, dishonest or unkind.\n\nThey act this way because they do not know better. I cannot be harmed by them unless I choose to be, and I cannot be angry with them, because we are made to work together, like two hands or two feet.\n\nSo begin the day not with dread but with readiness. You already know what may come. Decide now how you will meet it: with patience, with fairness and with a calm mind.",
      },
      {
        title: "What Is in Your Control",
        body:
          "Some things are up to us and some are not. Our opinions, our choices and our actions are ours. Our reputation, our wealth and what others think of us are not.\n\nMuch of our suffering comes from mixing the two. We worry endlessly about things we cannot change, and neglect the one thing we can: how we respond.\n\nWhen something troubles you, ask a simple question. Is this within my control? If it is, act. If it is not, let it go, and turn your attention back to doing the next right thing well.",
      },
    ],
  },
  {
    id: "the-jungle-book",
    title: "The Jungle Book",
    author: "Rudyard Kipling",
    category: "Classics",
    cover: "#3E6B2F",
    icon: "paw-outline",
    readMinutes: 4,
    description:
      "Mowgli, a boy raised by wolves in the jungles of India, learns the laws of the jungle from Baloo the bear and Bagheera the panther.",
    chapters: [
      {
        title: "The Man-Cub",
        body:
          "It was a warm evening in the Seeonee hills when Father Wolf woke from his rest and saw something strange at the mouth of the cave: a small brown baby, laughing and quite without fear.\n\nThe tiger Shere Khan had chased the child's family away and now roared that the cub belonged to him.\n\nMother Wolf stood between them, eyes blazing. \"He is mine,\" she said. \"He shall run with the pack, and one day he shall hunt you.\"\n\nShe named him Mowgli, the little frog, because he had no fur, and she raised him alongside her own cubs.",
      },
      {
        title: "The Law of the Jungle",
        body:
          "At the Council Rock, the wolves had to decide whether Mowgli could stay. Two voices spoke for him.\n\nBaloo, the sleepy brown bear who taught the wolf cubs the Law, promised to teach the man-cub too. Bagheera, the black panther, offered a freshly killed bull as the price of the boy's life.\n\nSo Mowgli grew up in the jungle. Baloo taught him the Master Words of every creature, and Bagheera taught him to climb, to swim and to move without a sound.\n\nAnd every lesson ended the same way: the strength of the pack is the wolf, and the strength of the wolf is the pack.",
      },
    ],
  },
  {
    id: "a-christmas-carol",
    title: "A Christmas Carol",
    author: "Charles Dickens",
    category: "Classics",
    cover: "#8E2C2C",
    icon: "candle",
    readMinutes: 4,
    description:
      "The miserly Ebenezer Scrooge is visited by three spirits in one night and learns what truly matters in life.",
    chapters: [
      {
        title: "Marley's Ghost",
        body:
          "Ebenezer Scrooge was the meanest man in London. He kept his office cold to save coal, paid his clerk Bob Cratchit almost nothing, and answered every wish of a merry Christmas with \"Humbug!\"\n\nOn Christmas Eve he went home alone to his dark rooms. As he turned the key, the door knocker changed into the face of Jacob Marley, his business partner, who had been dead for seven years.\n\nThat night Marley's ghost appeared, wrapped in heavy chains made of cash boxes and keys. \"I wear the chain I forged in life,\" he moaned. \"Yours is even longer. Three spirits will visit you. Listen to them, Ebenezer, it is your only chance.\"",
      },
      {
        title: "A Changed Man",
        body:
          "The spirits showed Scrooge his lonely past, the warm but poor Christmas of the Cratchit family, and a cold future in which no one mourned him.\n\nWhen he woke on Christmas morning, he laughed for the first time in years. He bought the biggest turkey in the shop and sent it to the Cratchits. He raised Bob's wages and became a second father to Bob's little son, Tiny Tim.\n\nAfter that, people said that if any man knew how to keep Christmas well, it was Ebenezer Scrooge.\n\nAnd as Tiny Tim said, God bless us, every one!",
      },
    ],
  },
  {
    id: "art-of-good-habits",
    title: "Small Steps, Big Change",
    author: "Library Editors",
    category: "Self-help",
    cover: "#2B6F8A",
    icon: "stairs-up",
    readMinutes: 3,
    description:
      "A short, practical guide to building good daily habits, one tiny step at a time.",
    chapters: [
      {
        title: "Start Smaller Than You Think",
        body:
          "Most new habits fail not because people are lazy, but because they begin too big. Reading thirty pages a day sounds wonderful until a busy evening arrives.\n\nInstead, start with something so small it feels almost silly: read one page, walk for five minutes, drink one glass of water after waking up.\n\nA tiny habit is easy to repeat, and repetition is what builds a habit. Once it is part of your day, growing it is easy. One page becomes five. Five minutes becomes twenty.\n\nThe goal of the first week is not progress. It is simply to show up.",
      },
      {
        title: "Attach It to Something You Already Do",
        body:
          "The easiest way to remember a new habit is to link it to an old one. After I brush my teeth, I will stretch for two minutes. After I pour my morning tea, I will write down one thing I am grateful for.\n\nYour existing routine becomes the reminder, so you no longer rely on willpower or memory.\n\nKeep a simple tick mark on a calendar for every day you complete the habit. Watching the chain of ticks grow is surprisingly motivating, and if you miss a day, just make sure you never miss two in a row.",
      },
    ],
  },
];

export const getBookById = (id) => BOOKS.find((b) => b.id === id);
