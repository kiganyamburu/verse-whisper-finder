export interface Verse {
  reference: string;
  text: string;
  context: string;
  chapter: string;
  theme: string;
}

export const BIBLE_VERSES: Verse[] = [
  {
    reference: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    chapter: "John 3",
    context: "Jesus explains the nature of God's love and salvation to Nicodemus, a member of the Jewish ruling council.",
    theme: "God's Love & Salvation"
  },
  {
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd, I shall not want.",
    chapter: "Psalm 23",
    context: "A psalm of David expressing deep trust in God's guidance, care, provision, and protection in times of darkness.",
    theme: "Trust & Protection"
  },
  {
    reference: "Genesis 1:1",
    text: "In the beginning God created the heavens and the earth.",
    chapter: "Genesis 1",
    context: "The opening declaration of the creation account, establishing God as the eternal Creator of all that exists.",
    theme: "Creation & Majesty"
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    chapter: "Romans 8",
    context: "Paul encourages the Roman believers by declaring that God's sovereign plan brings good out of every challenge.",
    theme: "God's Sovereign Plan"
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all this through him who gives me strength.",
    chapter: "Philippians 4",
    context: "Paul writes from prison about finding true contentment and endurance through Christ, regardless of his circumstances.",
    theme: "Strength & Contentment"
  },
  {
    reference: "Proverbs 3:5",
    text: "Trust in the Lord with all your heart and lean not on your own understanding.",
    chapter: "Proverbs 3",
    context: "Solomon advises his son to choose God's wisdom and direct paths rather than relying solely on human logic.",
    theme: "Wisdom & Faith"
  },
  {
    reference: "Isaiah 41:10",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
    chapter: "Isaiah 41",
    context: "God comforts Israel with promises of His constant presence, strength, and help in the midst of trial and captivity.",
    theme: "Comfort & Assurance"
  },
  {
    reference: "John 14:6",
    text: "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'",
    chapter: "John 14",
    context: "During the Last Supper, Jesus answers Thomas's question about how to reach the Father, defining His unique divine role.",
    theme: "Identity of Christ"
  },
  {
    reference: "Romans 12:2",
    text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.",
    chapter: "Romans 12",
    context: "Paul urges believers to offer their bodies as living sacrifices, marked by a transformed mind and holy living.",
    theme: "Christian Living"
  },
  {
    reference: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    chapter: "Joshua 1",
    context: "God commissions Joshua to lead Israel into the Promised Land after Moses' death, commanding courage based on His presence.",
    theme: "Courage & Calling"
  }
];
