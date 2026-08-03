export type CodexSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type CodexEntry = {
  slug: string;
  title: string;
  summary: string;
  unlockAfterStation: number;
  sections: readonly CodexSection[];
};

export const CODEX_ENTRIES: readonly CodexEntry[] = [
  {
    slug: "three-scripts-one-language",
    title: "Three scripts, one language",
    summary: "Where the three scripts came from, and why Japanese kept all of them.",
    unlockAfterStation: 1,
    sections: [
      {
        heading: "Japan borrowed a writing system that did not fit",
        paragraphs: [
          "Japanese was spoken for a long time before it was written. When writing arrived, around the fifth century, it arrived as Chinese: characters designed for a language with different sounds and, crucially, different grammar.",
          "Chinese words do not change shape. Japanese words do: verbs take endings, and small grammatical words hold a sentence together. Chinese characters had no way to write those endings. Scribes were left spelling out Japanese sounds using characters chosen only for their pronunciation, ignoring their meaning. It was slow to write and ambiguous to read.",
        ],
      },
      {
        heading: "Two scripts, invented from the same source",
        paragraphs: [
          "The fix was to simplify. Writers took characters used purely for sound and wore them down into something quicker. Hiragana came from cursive, flowing versions of whole characters. あ is a run-down form of 安, and you can still see the family resemblance. That rounded, sweeping quality is why hiragana looks the way it does.",
          "Katakana was cut from the same cloth but with a different method: monks annotating Chinese texts took a single fragment of a character as shorthand. カ is the left portion of 加. Taking pieces rather than whole cursive shapes is exactly why katakana looks angular where hiragana looks soft.",
          "So the two scripts you will learn are not arbitrary. They are two different ways of abbreviating the same original characters, and each kept the shape of the method that made it.",
        ],
      },
      {
        heading: "Why not simplify further and drop the rest?",
        paragraphs: [
          "It is a fair question, since hiragana alone can write every Japanese sound. The obstacle is that Japanese has a great many words that sound identical. Written in kanji they are plainly different words; written only in kana they collapse into each other, and the reader has to work them out from context.",
          "Kanji also does a job that spaces do in English. Japanese is written without spaces between words. Because kanji tends to carry the meaning-bearing parts and hiragana the grammatical glue, the switch between scripts shows the eye where one word ends and the next begins. Text in pure hiragana is genuinely harder to read, not easier.",
        ],
      },
      {
        heading: "What this means for your reading",
        paragraphs: [
          "Each script signals something before you have even read the word. Katakana suggests a word that came from outside Japanese, sometimes from a long way back: パン, bread, arrived from Portuguese pão some four hundred years ago. Kanji marks the content of a sentence. Hiragana carries the grammar.",
          "The direction runs both ways, and the script records it. Karaoke is Japanese through and through: 空 (kara, 'empty') joined to a clipping of the English 'orchestra'. Because that second half came from outside, the word is written カラオケ, in katakana. Tsunami is older and wholly native, so it is written in kanji: 津波, 'harbour wave'.",
          "Borrowed does not mean less Japanese. カメラ is the ordinary word for camera. Japanese coined its own term, 写真機, 'photograph machine', but it now sounds as dated as 'motorcar' and the borrowed word won. Every language does this; English took piano from Italian and shampoo from Hindi and absorbed them without a trace. Japanese absorbs them just as completely, but the writing system keeps the receipt: a word in katakana wears its history on its face.",
          "You can watch all three share the work in a single sentence: 私はコーヒーを飲みます, 'I drink coffee.' 私 and 飲 are kanji, carrying the meanings: I, drink. コーヒー is katakana: coffee, a borrowed word. Everything else is hiragana, bending those pieces into a sentence. Real Japanese text switches script every few characters, and each switch tells the eye something.",
          "You do not need to hold any of this in your head while you practise. It is here so that when katakana and kanji arrive, they arrive as parts of a system you already understand rather than as two more piles of memorisation.",
        ],
      },
    ],
  },
  {
    slug: "five-sounds-that-hold-still",
    title: "Five sounds that hold still",
    summary: "How Japanese words break into even sounds, and why those sounds never shift.",
    unlockAfterStation: 2,
    sections: [
      {
        heading: "Every word breaks into even sounds",
        paragraphs: [
          "You already know more Japanese words than you think, because English borrowed a pile of them. Tsunami, karaoke, sushi, origami, futon, tofu, karate, sudoku, emoji, ramen. Each one arrived with its sounds intact, and each one splits into small, even pieces:",
          "tsu-na-mi. ka-ra-o-ke. su-shi. o-ri-ga-mi. fu-ton. to-fu. ka-ra-te. su-do-ku. e-mo-ji. ra-men.",
          "Say them slowly and you can hear the pieces click apart. Every piece is either a single vowel (o, e) or a consonant followed by a vowel (tsu, na, mi). Japanese words are built almost entirely from those two shapes, which is why they land with such an even beat.",
          "This is the fact the whole writing system rests on. Japanese has a small, fixed set of these sounds, and each one gets exactly one symbol. That is why hiragana needs only 46 characters to write anything: it is not spelling out letters, it is listing sounds. からおけ is four symbols because karaoke is four sounds.",
          "The five vowels you just learned are the smallest of those pieces, and the two you can hear on their own in ka-ra-o-ke: the o and the e.",
        ],
      },
      {
        heading: "Which is why romaji misleads",
        paragraphs: [
          "In Latin letters, karaoke looks like eight letters that you have to work out how to group. Written in kana it is already grouped: か ら お け, one symbol per sound, nothing to guess.",
          "Romaji also invites you to read Japanese with English habits. Look at karate written that way and an English speaker naturally says 'kuh-RAH-tee', stretching one piece and swallowing another. The kana からて gives all four sounds equal weight, which is how the word is actually said: ka-ra-te.",
          "And romaji quietly hides the seams. Tsunami begins with a single Japanese sound, つ, written with three Latin letters that suggest something more complicated than it is. Sudoku is su-do-ku, three clean pieces, though the spelling gives you no hint of where they fall.",
          "None of this is a reason to feel behind. It is a reason the drills go straight to kana: the symbols show you the sounds, and English spelling does not.",
        ],
      },
      {
        heading: "English has one letter for many sounds",
        paragraphs: [
          "That evenness depends on each sound holding still, and the station said the five vowels do. It is worth seeing how strange that is, because English has trained you to expect the opposite.",
          "Take the letter a. In cat it is one sound, in car another, in cake another, in about it collapses into a vague grunt, and in many it is closer to an e. Five spellings of the same letter, five different sounds, and nothing on the page tells you which is which. You learned them word by word, over years, and you are still occasionally caught out by a word you have only ever read.",
          "English does this because its spelling froze while its pronunciation kept moving. The vowels drifted over centuries; the letters stayed where they were. So the letter stopped being a reliable instruction for what to say.",
        ],
      },
      {
        heading: "Japanese kept the promise",
        paragraphs: [
          "あ is a. It is a in every word, in every position, at any speed, next to any other sound, forever. The same is true of い う え お. There is no long form, no short form, no silent version, no stressed variant that opens up into a different sound.",
          "This is why the station spent its whole time on five characters and their sounds rather than on vocabulary. You were not learning five facts. You were learning five sounds that will be correct for the rest of the language, and no exceptions list is coming later.",
          "It also means the audio you were mimicking is the whole truth. When you hear あ in a word next month, it will be the sound you practised, not a cousin of it.",
        ],
      },
      {
        heading: "What that buys you",
        paragraphs: [
          "It makes reading aloud possible almost immediately. Once you know the sound each character stands for, you can pronounce a Japanese word you have never seen and have never heard, correctly, without being told how. You will not know what it means, but you will say it right.",
          "English does not offer this. Consider colonel, yacht, and though: you cannot derive their sound from their spelling, you can only have been told. Japanese never asks you to have been told.",
          "The five vowels are the foundation of that guarantee, which is why they came before everything else. Get them clean and every character built on them is clean too.",
        ],
      },
      {
        heading: "One honest caveat",
        paragraphs: [
          "Vowels can be held for two beats instead of one, and the length changes the word. This is written plainly, with an extra character, so nothing is hidden: おおきい (big) simply holds its first sound longer than おき would.",
          "That is a difference in *length*, not in quality. The sound itself is still the same a you learned; you are holding it, not changing it. So the promise holds, and you will meet long vowels properly when they matter.",
        ],
      },
    ],
  },
  {
    slug: "rows-and-the-table",
    title: "Rows, and the table they sit in",
    summary: "You have learned two rows. Here is the grid they belong to, and why it makes the rest easier.",
    unlockAfterStation: 3,
    sections: [
      {
        heading: "You have just learned a row",
        paragraphs: [
          "The five vowels came first: あ い う え お. Then か き く け こ, which is the same five vowels with a k in front. That is not a coincidence in how the course is ordered. It is how the writing system is built.",
          "Take a consonant, run it across the five vowels, and you get a row of five characters. k gives か き く け こ. That is the whole trick, and it repeats: s gives さ し す せ そ, t gives た ち つ て と, n gives な に ぬ ね の, and so on through the set.",
          "So the 46 characters are not 46 unrelated shapes to memorise. They are nine rows of five, plus a couple of stragglers. You have done two of those rows already.",
        ],
      },
      {
        heading: "The rows form a table",
        paragraphs: [
          "Written out, the rows stack into a grid, five columns wide. The columns are the five vowels, always in the order あ い う え お. Each row is a consonant crossed with them.",
          "The grid has a name: the gojūon (五十音), 'fifty sounds'. Reading across a row gives you that consonant with each vowel in turn. Reading down a column gives you every character that shares a vowel: あ か さ た な, all of them ending in the same a.",
          "The two rows you know are the top two lines. Everything ahead of you is more rows in the same shape, which is why the second row felt quicker than the first, and the third will feel quicker still.",
        ],
      },
      {
        heading: "The vowel does the work",
        paragraphs: [
          "This is why the course spent a whole station on あ い う え お before teaching a single consonant. Those five sounds are not just the first five characters. They are the axis the other 41 are built on.",
          "Every character in the table is either a bare vowel or a consonant joined to one. Get the five vowels clean and steady, and every row after that is one new consonant sound laid over vowels you already produce correctly. Get them sloppy, and the error repeats 41 times.",
          "It also means you can often guess how an unfamiliar character sounds once you know which row it sits in. That is not true of the English alphabet, where nothing about the shape of 'q' tells you anything about the shape of 'p'.",
        ],
      },
      {
        heading: "A few cells do not behave",
        paragraphs: [
          "The table is regular, but not perfectly. A handful of cells drifted in pronunciation while their position stayed put, so they do not say quite what the grid predicts.",
          "In the s-row, し is 'shi' rather than 'si'. In the t-row, ち is 'chi' and つ is 'tsu'. Later, in the h-row, ふ lands closer to 'fu' than 'hu'. That is four or five cells out of the whole set, and you will meet each one when its row comes.",
          "The k row you just finished has none of them. か き く け こ are exactly what the pattern says they should be, which is part of why it makes such a good first row.",
        ],
      },
      {
        heading: "What to do with this",
        paragraphs: [
          "Nothing, for now. You do not need to memorise the table, or know the word gojūon, or be able to recite the rows you have not learned yet. The drills will keep coming one row at a time.",
          "It is worth knowing only because it changes what you are doing. You are not collecting 46 separate facts. You are filling in a grid, five cells at a time, and the grid is small enough to finish.",
        ],
      },
    ],
  },
  {
    slug: "why-the-kana-are-ordered",
    title: "Why the kana are ordered as they are",
    summary: "The grid sorts Japanese the way A-B-C sorts English, and it has a few gaps worth knowing.",
    unlockAfterStation: 8,
    sections: [
      {
        heading: "The order itself is the point",
        paragraphs: [
          "You met the gojūon grid back at the k row: five vowel columns, a consonant per row. By now you have filled in five of those rows, twenty-five characters, and the shape is familiar.",
          "What has not been said yet is that the grid is also an ordering, and Japanese leans on it as heavily as English leans on the alphabet. あいうえお is not just how the characters are taught. It is the sequence the language sorts by.",
        ],
      },
      {
        heading: "Why fifty, when there are only 46?",
        paragraphs: [
          "Ten rows times five columns is fifty slots, but the grid is not completely full. The y-row has only や ゆ よ; the sounds that would sit in the い and え columns dropped out of the language long ago. The w-row has kept わ and を and lost the rest.",
          "One character sits outside the table altogether: ん. Every other kana is a whole syllable: a consonant and a vowel together, or a vowel alone. ん is a bare consonant sound, the only one Japanese writes on its own, and it belongs to no row and no column.",
          "So the count lands at 46 while the name kept the rounder, older number. This is normal for the grid: it describes the sound system as it was, and the language moved.",
        ],
      },
      {
        heading: "Where the table bends",
        paragraphs: [
          "You have now met the cells that do not say what their position predicts. し is 'shi' rather than 'si'; ち is 'chi' and つ is 'tsu'. Only ふ, closer to 'fu' than 'hu', is still ahead of you in the h-row.",
          "These are not errors or exceptions to be dreaded. The grid is organised by how the sounds pattern in Japanese, and in a few places the actual pronunciation drifted while the slot stayed put. You have learned the ones that bend, and the rest of the table behaves.",
          "It is also a clean illustration of why Michi does not teach through romaji. Spelled in Latin letters, し and ち look like arbitrary exceptions to a rule. Learned as kana in their place in the grid, they are simply what those cells sound like.",
        ],
      },
      {
        heading: "It is the order everything is sorted in",
        paragraphs: [
          "Gojūon order is Japanese's A-B-C, and it does the same practical work. Dictionaries are ordered by it. So are indexes, class registers, phone directories, the name fields on forms, and the tabs down the side of a filing system.",
          "This is the quiet reason to know the sequence rather than just the characters. Being able to read あ い う え お is recognition. Knowing that さ comes before た, which comes before な, is what lets you actually find something in a Japanese dictionary.",
        ],
      },
      {
        heading: "What you have filled in so far",
        paragraphs: [
          "You know the vowel row and the k, s, t and n rows: the top five lines of the table, twenty-five characters. Everything still ahead of you is the same shape: h, m, y, r, w, and then ん on its own at the end.",
          "There is no new system to learn from here. There are only more rows.",
        ],
      },
    ],
  },
] as const;

export function codexEntry(slug: string): CodexEntry | undefined {
  return CODEX_ENTRIES.find((entry) => entry.slug === slug);
}
