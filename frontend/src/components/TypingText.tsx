import { useEffect, useMemo, useState } from "react";

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
  const activePhrases = useMemo(() => {
    const cleaned = phrases?.map((phrase) => phrase.trim()).filter(Boolean);
    return cleaned?.length ? cleaned : fallbackPhrases;
  }, [phrases]);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = activePhrases[phraseIndex] ?? fallbackPhrases[0];

    const delay = isDeleting ? 30 : 90;

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        const nextText = currentPhrase.slice(0, displayText.length + 1);
        setDisplayText(nextText);

        if (nextText === currentPhrase) {
          window.setTimeout(() => {
            setIsDeleting(true);
          }, 5000);
        }

        return;
      }

      const nextText = currentPhrase.slice(0, displayText.length - 1);
      setDisplayText(nextText);

      if (nextText === "") {
        setIsDeleting(false);
        setPhraseIndex((currentIndex) => {
          return (currentIndex + 1) % activePhrases.length;
        });
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activePhrases, phraseIndex, displayText, isDeleting]);

  return (
    <span className="typing-text">
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
}

export default TypingText;
