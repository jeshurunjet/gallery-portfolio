import { useEffect, useState } from "react";

const fallbackPhrases = [
  "Full-stack developer with a designer's eye.",
  "Developer by craft. Designer by instinct.",
  "Bridging creativity and technology.",
  "Turning ideas into digital experiences.",
];

type TypingTextProps = {
  phrases?: string[];
};

function TypingText({ phrases }: TypingTextProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const activePhrases = phrases?.filter(Boolean).length
    ? phrases.filter(Boolean)
    : fallbackPhrases;

  useEffect(() => {
    const currentPhrase = activePhrases[phraseIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          const nextText = currentPhrase.slice(0, text.length + 1);
          setText(nextText);

          if (nextText === currentPhrase) {
            setTimeout(() => setIsDeleting(true), 5000);
          }
        } else {
          const nextText = currentPhrase.slice(0, text.length - 1);
          setText(nextText);

          if (nextText === "") {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % activePhrases.length);
          }
        }
      },
      isDeleting ? 30 : 90
    );

    return () => clearTimeout(timeout);
  }, [activePhrases, isDeleting, phraseIndex, text]);

  useEffect(() => {
    setPhraseIndex(0);
    setText("");
    setIsDeleting(false);
  }, [activePhrases]);

  return (
    <span className="typing-text">
      {text}
      <span className="typing-cursor">|</span>
    </span>
  );
}

export default TypingText;
